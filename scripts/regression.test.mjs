import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(file, dependencies, globals = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
  } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, require: (id) => {
    assert.ok(id in dependencies, `Unexpected import: ${id}`);
    return dependencies[id];
  }, ...globals });
  return compiledModule.exports;
}

// Exercise the actual component with deterministic hook lifecycles and a fake clock.
// Effects commit after render; Effect Events keep their identity and read the latest callback.
function quizHarness({ failFirstSubmission = false } = {}) {
  const slots = [], effects = [], timers = new Map(), payloads = [];
  let cursor = 0, dirty = false, tree, clock = 0, nextTimer = 0;
  const equalDeps = (left, right) => left?.length === right?.length && left.every((v, i) => Object.is(v, right[i]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (next) => {
        const value = typeof next === "function" ? next(slots[index]) : next;
        if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useMemo(factory, deps) {
      const index = cursor++;
      if (!slots[index] || !equalDeps(slots[index].deps, deps)) slots[index] = { deps, value: factory() };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !equalDeps(slots[index].deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: callback() };
      });
    },
    useEffectEvent(callback) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { event: (...args) => slots[index].callback(...args) };
      slots[index].callback = callback;
      return slots[index].event;
    },
  };
  const service = {
    getAssessmentForTaking: async () => ({ id: "quiz", title: "Test", durationMinutes: 1,
      questions: [{ id: "question", questionText: "Choose", marks: 1,
        options: [{ id: "option-a", optionText: "A" }, { id: "option-b", optionText: "B" }] }] }),
    submitQuiz: async (id, payload) => {
      payloads.push({ id, payload });
      if (failFirstSubmission && payloads.length === 1) throw new Error("Temporary failure");
      return { submissionId: "submitted" };
    },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const { StudentQuizTakingModal } = compile("src/components/student/StudentQuizTakingModal.tsx", {
    react: hooks, "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "lucide-react": new Proxy({}, { get: (_, name) => name }),
    "@/services/assessmentService": { assessmentService: service },
  }, {
    Date: class extends Date { static now() { return clock; } }, alert() {},
    setInterval(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearInterval(id) { timers.delete(id); },
  });
  function render() {
    cursor = 0; dirty = false;
    const session = StudentQuizTakingModal({ assessmentId: "quiz", onClose() {}, onSubmitSuccess() {} });
    tree = session.type(session.props);
    while (effects.length) effects.shift()();
  }
  async function flush() {
    for (let n = 0; n < 12; n++) { await Promise.resolve(); if (dirty) render(); }
  }
  function find(predicate, node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { for (const child of node) { const hit = find(predicate, child); if (hit) return hit; } }
    else { if (predicate(node)) return node; return find(predicate, node.props?.children); }
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join("");
    if (node && typeof node === "object") return text(node.props?.children);
    return node === undefined || node === null || typeof node === "boolean" ? "" : String(node);
  }
  return {
    payloads,
    async start() { render(); await flush(); },
    async chooseB() { const button = find((n) => n.type === "button" && n.key === "option-b", tree); assert.ok(button); button.props.onClick(); await flush(); },
    async advance(ms) { clock += ms; for (const callback of [...timers.values()]) callback(); await flush(); },
    async click(label) { const button = find((n) => n.type === "button" && text(n).includes(label), tree); assert.ok(button); assert.ok(!button.props.disabled); await button.props.onClick(); await flush(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

test("quiz timeout submits the latest selected option exactly once", async () => {
  const quiz = quizHarness(); await quiz.start(); await quiz.chooseB(); await quiz.advance(60_000);
  assert.equal(quiz.payloads.length, 1);
  assert.equal(quiz.payloads[0].payload.answers[0].selectedOptionId, "option-b");
  await quiz.advance(10_000); assert.equal(quiz.payloads.length, 1); quiz.unmount();
});

test("failed timeout submission permits a manual retry with the selected answers", async () => {
  const quiz = quizHarness({ failFirstSubmission: true }); await quiz.start(); await quiz.chooseB();
  await quiz.advance(60_000); await quiz.advance(2_000); assert.equal(quiz.payloads.length, 1);
  await quiz.click("Finish & Submit"); await quiz.click("Submit Exam");
  assert.equal(quiz.payloads.length, 2);
  assert.equal(quiz.payloads[1].payload.answers[0].selectedOptionId, "option-b"); quiz.unmount();
});

test("closing the quiz clears the countdown without submitting", async () => {
  const quiz = quizHarness(); await quiz.start(); quiz.unmount(); await quiz.advance(60_000);
  assert.equal(quiz.payloads.length, 0);
});

test("local attachments use the backend origin and bearer authentication", async () => {
  const requests = [], downloaded = [];
  class BrowserURL extends URL {
    static createObjectURL() { return "blob:attachment"; }
    static revokeObjectURL() {}
  }
  const api = compile("src/lib/api.ts", {}, {
    process: { env: { NEXT_PUBLIC_API_URL: "http://localhost:8080/api/v1" } }, URL: BrowserURL,
    window: {}, localStorage: { getItem: () => "test-token" },
    document: { body: { appendChild() {} }, createElement: () => ({ click() { downloaded.push(this.href); }, remove() {} }) },
    setTimeout(callback) { callback(); },
    fetch: async (url, options) => { requests.push({ url: url.href, options }); return { ok: true, blob: async () => ({}) }; },
  });
  const url = api.getLocalAssessmentFileUrl("/api/v1/assessments/files/paper.pdf");
  assert.equal(url.origin, "http://localhost:8080");
  assert.equal(api.getLocalAssessmentFileUrl("https://external.test/api/v1/assessments/files/paper.pdf"), null);
  await api.downloadAssessmentFile(url);
  assert.equal(requests[0].options.headers.Authorization, "Bearer test-token");
  assert.deepEqual(downloaded, ["blob:attachment"]);
  await assert.rejects(api.downloadAssessmentFile(new URL("https://external.test/private.pdf")));
  assert.equal(requests.length, 1);
});

test("student assessment states distinguish submitted work from published results", () => {
  const { studentAssessmentStatus } = compile("src/lib/utils/resultVisibility.ts", {});
  assert.equal(studentAssessmentStatus({ submitted: false, resultPublished: false }), "To do");
  assert.equal(studentAssessmentStatus({ submitted: true, resultPublished: false }), "Awaiting results");
  assert.equal(studentAssessmentStatus({ submitted: true, resultPublished: true }), "Graded");
});

test("the pending result view never renders scores, feedback or answer keys", () => {
  const jsx = (type, props) => ({ type, props });
  const { QuizResultModal } = compile("src/components/student/QuizResultModal.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "lucide-react": new Proxy({}, { get: (_, name) => name }),
  });
  const result = { title: "Assessment", resultPublished: false, status: "GRADED", scoreObtained: 87,
    grade: "A", feedback: "PRIVATE_FEEDBACK", answers: [{ questionText: "PRIVATE_ANSWER_KEY" }] };
  const rendered = JSON.stringify(QuizResultModal({ result, onClose() {} }));
  assert.ok(rendered.includes("Submission received"));
  assert.ok(!rendered.includes("PRIVATE_FEEDBACK"));
  assert.ok(!rendered.includes("PRIVATE_ANSWER_KEY"));
  assert.ok(!rendered.includes('"87"'));
});
