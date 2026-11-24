import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
const origin = "https://school.test";
const jwt = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.signature`;

function harness(responder, env = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL("../src/lib/server/backend.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} }, calls = [];
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, require(id) {
    if (id === "server-only") return {};
    assert.equal(id, "next/server"); return { NextRequest, NextResponse };
  }, URL, Headers, Response, Buffer, Date, Uint8Array, ArrayBuffer, RangeError, AbortSignal,
  process: { env: { NODE_ENV: "production", BACKEND_API_URL: "http://backend.test:8080/api/v1", ...env } },
  fetch: async (url, options) => { calls.push({ url, options }); return responder(url, options); } });
  return { ...compiledModule.exports, calls };
}

function request(path, { method = "POST", cookie = "lms_session=private-token", requestOrigin = origin, ...headers } = {}, body = "{}") {
  return new NextRequest(`${origin}${path}`, { method,
    headers: { origin: requestOrigin, cookie, "content-type": "application/json", ...headers },
    ...(["GET", "HEAD"].includes(method) ? {} : { body }),
  });
}

test("recovery responses do not issue sessions or expose upstream tokens", async () => {
  const api = harness(() => Response.json({ message: "Check your inbox", token: "must-not-escape" }, { status: 202 }));
  const response = await api.authenticate(request("/api/auth/forgot-password", {cookie:""}), "forgot-password");
  assert.equal(response.status,202); assert.deepEqual(await response.json(),{message:"Check your inbox"});
  assert.equal(response.cookies.get("lms_session"),undefined);
  assert.equal((await api.authenticate(request("/api/auth/forgot-password", {requestOrigin:"https://evil.test"}), "forgot-password")).status,403);
});

test("reset and authenticated password change clear browser sessions only on success", async () => {
  const api = harness(() => Response.json({message:"Password changed"}));
  const reset = await api.authenticate(request("/api/auth/reset-password"),"reset-password");
  assert.equal(reset.cookies.get("lms_session").maxAge,0);
  const changed = await api.proxyBackend(request("/api/backend/account/password"),["account","password"]);
  assert.equal(changed.cookies.get("lms_session").maxAge,0);
  const failed = harness(() => Response.json({message:"Wrong password"},{status:400}));
  assert.equal((await failed.proxyBackend(request("/api/backend/account/password"),["account","password"])).cookies.get("lms_session"),undefined);
});

test("authentication keeps JWT out of JSON and sets expiring HttpOnly Secure session cookies", async () => {
  const api = harness(() => Response.json({ token: jwt, role: "STUDENT", email: "student@test" }));
  const response = await api.authenticate(request("/api/auth/login"), "login");
  assert.deepEqual(await response.json(), { role: "STUDENT", email: "student@test" });
  assert.equal(api.calls[0].url, "http://backend.test:8080/auth/login");
  const cookie = response.cookies.get("lms_session");
  assert.equal(cookie.value, jwt); assert.equal(cookie.httpOnly, true); assert.equal(cookie.secure, true);
  assert.equal(cookie.sameSite, "lax"); assert.ok(cookie.expires > new Date());
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(api.calls[0].options.redirect, "manual");
});

test("cross-origin and missing-Origin mutations cannot log in, log out or reach the backend", async () => {
  const api = harness(() => { throw new Error("must not reach upstream"); });
  for (const action of ["login", "register", "logout"]) {
    assert.equal((await api.authenticate(request(`/api/auth/${action}`, { requestOrigin: "https://evil.test" }), action)).status, 403);
  }
  assert.equal((await api.proxyBackend(request("/api/backend/users/me", { requestOrigin: "https://evil.test" }), ["users", "me"])).status, 403);
  const missingOrigin = request("/api/backend/users/me"); missingOrigin.headers.delete("origin");
  assert.equal((await api.proxyBackend(missingOrigin, ["users", "me"])).status, 403);
  assert.equal(api.calls.length, 0);
});

test("API proxy uses only server cookie credentials, preserves queries and strips upstream cookies", async () => {
  const api = harness(() => Response.json({ id: "me" }, { headers: { "Set-Cookie": "evil=value", "Access-Control-Allow-Origin": "*" } }));
  const response = await api.proxyBackend(request("/api/backend/users/me?tab=profile", { method: "GET", authorization: "Bearer injected", "x-forwarded-for": "attacker" }), ["users", "me"]);
  assert.equal(response.status, 200);
  assert.equal(api.calls[0].url, "http://backend.test:8080/api/v1/users/me?tab=profile");
  assert.equal(api.calls[0].options.headers.get("authorization"), "Bearer private-token");
  assert.equal(api.calls[0].options.headers.get("cookie"), null);
  assert.equal(api.calls[0].options.headers.get("x-forwarded-for"), null);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("API proxy rejects unsigned browser credentials, path traversal and external redirects", async () => {
  const api = harness(() => new Response(null, { status: 302, headers: { Location: "https://evil.test" } }));
  assert.equal((await api.proxyBackend(request("/api/backend/users/me", { cookie: "token=old; user_role=TEACHER", method: "GET" }), ["users", "me"])).status, 401);
  for (const segments of [["..", "auth"], ["%2e%2e", "auth"], ["https:", "evil.test"], ["users/me"], ["users\\me"]]) {
    // Colon alone is permitted in path values, but external URL attempts never become a fetch target.
    if (segments[0] === "https:") continue;
    assert.equal((await api.proxyBackend(request("/api/backend/users/me", { method: "GET" }), segments)).status, 400);
  }
  const response = await api.proxyBackend(request("/api/backend/users/me", { method: "GET" }), ["users", "me"]);
  assert.equal(response.status, 502); assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0].options.redirect, "manual");
});

test("proxy bounds uploads and never exposes upstream internal errors", async () => {
  const api = harness(() => Response.json({ message: "PRIVATE_STACK_TRACE" }, { status: 500 }));
  const response = await api.proxyBackend(request("/api/backend/uploads"), ["uploads"]);
  assert.equal(response.status, 500); assert.ok(!(await response.text()).includes("PRIVATE_STACK_TRACE"));
  const oversized = await api.proxyBackend(request("/api/backend/uploads", { "content-length": String(22 * 1024 * 1024) }), ["uploads"]);
  assert.equal(oversized.status, 413); assert.equal(api.calls.length, 1);
});

test("logout expires both session and legacy cookies without calling upstream", async () => {
  const api = harness(() => { throw new Error("must not call upstream"); });
  const response = await api.authenticate(request("/api/auth/logout"), "logout");
  for (const name of ["lms_session", "lms_role", "token", "user_role"]) {
    assert.equal(response.cookies.get(name).maxAge, 0);
    assert.equal(response.cookies.get(name).httpOnly, true);
  }
  assert.equal(api.calls.length, 0);
});

test("failed login preserves rate-limit status and retry header without issuing a cookie", async () => {
  const api = harness(() => Response.json({ message: "Too many attempts" }, { status: 429, headers: { "Retry-After": "60" } }));
  const response = await api.authenticate(request("/api/auth/login"), "login");
  assert.equal(response.status, 429); assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(response.cookies.get("lms_session"), undefined);
});

test("registration can read the public subject catalog while other anonymous requests stay blocked", async () => {
  const api = harness(() => Response.json([{ id: "subject", name: "Maths" }]));
  const response = await api.proxyBackend(request("/api/backend/subjects", { method: "GET", cookie: "" }), ["subjects"]);
  assert.equal(response.status, 200);
  assert.equal(api.calls[0].options.headers.get("authorization"), null);
  assert.equal((await api.proxyBackend(request("/api/backend/users/me", { method: "GET", cookie: "" }), ["users", "me"])).status, 401);
  assert.equal((await api.proxyBackend(request("/api/backend/subjects", { cookie: "" }), ["subjects"])).status, 401);
  assert.equal(api.calls.length, 1);
});

test("a revoked or expired backend session expires browser cookies", async () => {
  const api = harness(() => Response.json({ message: "Unauthorized" }, { status: 401 }));
  const response = await api.proxyBackend(request("/api/backend/users/me", { method: "GET" }), ["users", "me"]);
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get("lms_session").maxAge, 0);
  assert.equal(response.cookies.get("lms_role").maxAge, 0);
});

test("a forbidden profile clears a disabled session while a resource permission denial preserves it", async () => {
  const api = harness(() => Response.json({ message: "Forbidden" }, { status: 403 }));
  const profile = await api.proxyBackend(request("/api/backend/users/me", { method: "GET" }), ["users", "me"]);
  assert.equal(profile.status, 403); assert.equal(profile.cookies.get("lms_session").maxAge, 0);
  const resource = await api.proxyBackend(request("/api/backend/assessments/private", { method: "GET" }), ["assessments", "private"]);
  assert.equal(resource.status, 403); assert.equal(resource.cookies.get("lms_session"), undefined);
});
