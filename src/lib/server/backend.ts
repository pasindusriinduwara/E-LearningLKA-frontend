import "server-only";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "lms_session";
export const ROLE_COOKIE = "lms_role";
const MAX_BODY_BYTES = 21 * 1024 * 1024;

export function backendOrigin(): string {
    const configured = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const url = new URL(configured);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || !["", "/", "/api/v1", "/api/v1/"].includes(url.pathname)) {
        throw new Error("Invalid backend configuration");
    }
    return url.origin;
}

export function jsonError(message: string, status: number): NextResponse {
    return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function isSameOriginMutation(request: NextRequest): boolean {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
    const expected = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).origin : request.nextUrl.origin;
    return request.headers.get("origin") === expected && request.headers.get("sec-fetch-site") !== "cross-site";
}

export async function readLimitedBody(request: NextRequest, maximum = MAX_BODY_BYTES): Promise<ArrayBuffer> {
    if (Number(request.headers.get("content-length") || 0) > maximum) throw new RangeError("Request body too large");
    if (!request.body) return new ArrayBuffer(0);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maximum) { await reader.cancel(); throw new RangeError("Request body too large"); }
        chunks.push(value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return body.buffer;
}

export function clearSession(response: NextResponse): void {
    for (const name of [SESSION_COOKIE, ROLE_COOKIE, "token", "user_role"]) {
        response.cookies.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    }
}

export function setSession(response: NextResponse, token: string, role: string): void {
    // The token came directly from our configured authentication service. Backend verifies its signature on every API call.
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    if (!Number.isFinite(payload.exp) || payload.exp! * 1000 <= Date.now()) throw new Error("Invalid session expiration");
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", expires: new Date(payload.exp! * 1000) };
    response.cookies.set(SESSION_COOKIE, token, options);
    response.cookies.set(ROLE_COOKIE, role, options);
    for (const name of ["token", "user_role"]) response.cookies.set(name, "", { ...options, maxAge: 0 });
}

export async function proxyBackend(request: NextRequest, segments: string[]): Promise<Response> {
    if (!isSameOriginMutation(request)) return jsonError("Cross-origin requests are not allowed", 403);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const publicRead = ["GET", "HEAD"].includes(request.method) && segments.length === 1 && segments[0] === "subjects";
    if (!token && !publicRead) return jsonError("Please sign in to continue", 401);
    // Never allow a client-controlled URL, encoded separator or dot segment to escape /api/v1/.
    if (!segments.length || segments.some((part) => !part || part === "." || part === ".." || /[\\/%\x00-\x20?#]/.test(part))) {
        return jsonError("Invalid API path", 400);
    }
    try {
        const headers = new Headers();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        for (const name of ["content-type", "accept"]) {
            const value = request.headers.get(name);
            if (value) headers.set(name, value);
        }
        const body = ["GET", "HEAD"].includes(request.method) ? undefined : await readLimitedBody(request);
        const upstream = await fetch(`${backendOrigin()}/api/v1/${segments.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, {
            method: request.method, headers, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(120_000),
        });
        if (upstream.status >= 300 && upstream.status < 400) return jsonError("Unexpected API redirect", 502);
        // Never forward Set-Cookie, CORS headers, hop-by-hop headers or public cache directives.
        const responseHeaders = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
        for (const name of ["content-type", "content-disposition", "retry-after"]) {
            const value = upstream.headers.get(name);
            if (value) responseHeaders.set(name, value);
        }
        if (upstream.status >= 500) return jsonError("The service is temporarily unavailable. Please try again.", upstream.status);
        const response = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
        const deniedProfile = upstream.status === 403 && request.method === "GET" && segments.length === 2 && segments[0] === "users" && segments[1] === "me";
        if (upstream.status === 401 || deniedProfile) clearSession(response);
        return response;
    } catch (error) {
        return error instanceof RangeError ? jsonError("Request body too large", 413) : jsonError("The service is temporarily unavailable. Please try again.", 502);
    }
}

export async function authenticate(request: NextRequest, action: string): Promise<NextResponse> {
    if (!isSameOriginMutation(request)) return jsonError("Cross-origin requests are not allowed", 403);
    if (action === "logout") {
        const response = NextResponse.json({ message: "Signed out" }, { headers: { "Cache-Control": "no-store" } });
        clearSession(response);
        return response;
    }
    if (action !== "login" && action !== "register") return jsonError("Not found", 404);
    try {
        const body = await readLimitedBody(request, 64 * 1024);
        const upstream = await fetch(`${backendOrigin()}/auth/${action}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body,
            redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(30_000),
        });
        if (upstream.status >= 300 && upstream.status < 400) return jsonError("Unexpected authentication redirect", 502);
        if (!upstream.ok) {
            const failure = upstream.status >= 500 ? jsonError("Authentication service is temporarily unavailable", 502)
                : NextResponse.json(await upstream.json().catch(() => ({ message: "Authentication failed" })), { status: upstream.status, headers: { "Cache-Control": "no-store" } });
            const retryAfter = upstream.headers.get("retry-after");
            if (retryAfter) failure.headers.set("Retry-After", retryAfter);
            return failure;
        }
        const data = await upstream.json() as { token?: string; role?: string; email?: string; name?: string };
        if (!data.token || !["STUDENT", "TEACHER"].includes(data.role || "")) return jsonError("Invalid authentication response", 502);
        const response = NextResponse.json({ role: data.role, email: data.email, name: data.name }, { headers: { "Cache-Control": "no-store" } });
        setSession(response, data.token, data.role!);
        return response;
    } catch (error) {
        return error instanceof RangeError ? jsonError("Request body too large", 413) : jsonError("Authentication service is temporarily unavailable", 502);
    }
}
