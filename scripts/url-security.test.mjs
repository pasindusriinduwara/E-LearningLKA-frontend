import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, URL,
    require(id) { assert.ok(id in dependencies, `Unexpected import: ${id}`); return dependencies[id]; },
    ...globals,
  });
  return compiled.exports;
}

const video = load("src/lib/videoUtils.ts");

test("resource links reject active schemes, credentials and disguised external origins", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,test", "vbscript:msgbox(1)", "file:///tmp/file", "blob:https://example.com/123", "//attacker.test/file", "/\\attacker.test/file", "https://teacher:password@example.com/file", "https://example.com/\njavascript:test"]) {
    assert.equal(video.getSafeResourceUrl(url), "", url);
    assert.equal(video.getEmbedVideoUrl(url).embedUrl, "", url);
  }
  assert.equal(video.getSafeResourceUrl(" /api/v1/assessments/files/paper.pdf "), "/api/v1/assessments/files/paper.pdf");
  assert.equal(video.getSafeResourceUrl("example.com/resource"), "https://example.com/resource");
  assert.equal(video.getSafeResourceUrl("https://example.com/resource?file=1"), "https://example.com/resource?file=1");
});

test("only exact trusted provider hosts produce iframe sources", () => {
  for (const url of [
    "https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ",
    "https://attacker.test/youtube.com/watch?v=dQw4w9WgXcQ",
    "https://attacker.test/?url=https://youtu.be/dQw4w9WgXcQ",
    "https://drive.google.com.attacker.test/file/d/file-id/view",
    "https://vimeo.com.attacker.test/123456",
    "https://youtube.com:8443/watch?v=dQw4w9WgXcQ",
    "https://example.com/embed/video",
    "/local-embed",
  ]) {
    const parsed = video.getEmbedVideoUrl(url);
    assert.equal(parsed.embedUrl, "", url);
    assert.equal(parsed.originalUrl, video.getSafeResourceUrl(url));
  }
});

test("known video links normalize to fixed HTTPS iframe origins", () => {
  for (const url of ["youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=1", "https://m.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"]) {
    const parsed = video.getEmbedVideoUrl(url);
    assert.equal(parsed.embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0");
    assert.equal(parsed.isDirectVideo, false);
  }
  assert.equal(video.getEmbedVideoUrl("https://drive.google.com/file/d/file-123/view?usp=sharing").embedUrl, "https://drive.google.com/file/d/file-123/preview");
  assert.equal(video.getEmbedVideoUrl("https://vimeo.com/123456").embedUrl, "https://player.vimeo.com/video/123456?autoplay=1");
  assert.equal(video.getEmbedVideoUrl("https://player.vimeo.com/video/123456").embedUrl, "https://player.vimeo.com/video/123456?autoplay=1");
  assert.equal(video.getEmbedVideoUrl("https://youtube.com/watch?v=dQw4w9WgXcQextra").embedUrl, "");
});

test("direct web and local video files remain playable without becoming iframes", () => {
  for (const url of ["https://cdn.example.com/class.mp4?token=123#start", "/recordings/class.webm", "http://localhost:8080/class.ogg"]) {
    const parsed = video.getEmbedVideoUrl(url);
    assert.equal(parsed.isDirectVideo, true);
    assert.equal(parsed.embedUrl, url);
  }
  assert.equal(video.getEmbedVideoUrl("https://example.com/embed?file=class.mp4").embedUrl, "");
});

test("unsafe attachment links cannot navigate or start an authenticated download", async () => {
  let prevented = false, requested = false;
  const jsx = (type, props) => ({ type, props });
  const { AttachmentLink } = load("src/components/common/AttachmentLink.tsx", {
    react: { useState: (initial) => [initial, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "@/lib/api": { getLocalAssessmentFileUrl: () => { requested = true; }, downloadAssessmentFile: () => { requested = true; } },
    "@/lib/videoUtils": video,
  });
  const tree = AttachmentLink({ href: "javascript:alert(1)", children: "Download" });
  const anchor = tree.props.children[0];
  assert.equal(anchor.props.href, undefined);
  assert.equal(anchor.props["aria-disabled"], true);
  await anchor.props.onClick({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(requested, false);
});

test("production security headers restrict framing and keep scripts on the app origin", async () => {
  const config = load("next.config.ts", {}, { process: { env: { NODE_ENV: "production" } } }).default;
  const headers = Object.fromEntries((await config.headers())[0].headers.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /connect-src 'self';/);
  assert.ok(!headers["Content-Security-Policy"].includes("unsafe-eval"));
  const frameSources = headers["Content-Security-Policy"].split("; ").find((item) => item.startsWith("frame-src "));
  assert.equal(frameSources, "frame-src https://www.youtube-nocookie.com https://drive.google.com https://player.vimeo.com");
});
