import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const deferred = () => {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
};

function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

function content(node) {
  if (Array.isArray(node)) return node.map(content).join("");
  if (node && typeof node === "object") return content(node.props?.children);
  return node == null || typeof node === "boolean" ? "" : String(node);
}

function classroomLifecycleHarness({ refreshAssessments } = {}) {
  let slots = [], cursor = 0, dirty = false, tree, componentKey, unmounted = false;
  let approved = true, tab = "assignments", updatesAfterUnmount = 0;
  const effects = [], calls = [], intervals = new Map();
  const listeners = { window: new Map(), document: new Map() };
  const auth = { user: { id: "user-1", studentId: "student-1" } };
  const params = { batchId: "biology" };
  const document = { visibilityState: "visible", ...events("document") };
  const window = {
    ...events("window"),
    setInterval(callback, milliseconds) { const id = intervals.size + 1; intervals.set(id, { callback, milliseconds }); return id; },
    clearInterval(id) { intervals.delete(id); },
  };
  function events(target) {
    return {
      addEventListener(name, callback) { const registered = listeners[target].get(name) || new Set(); registered.add(callback); listeners[target].set(name, registered); },
      removeEventListener(name, callback) { listeners[target].get(name)?.delete(callback); },
    };
  }
  const equalDeps = (left, right) => left?.length === right?.length && left.every((value, index) => Object.is(value, right[index]));
  const hooks = {
    Suspense: "Suspense",
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (next) => {
        if (unmounted) updatesAfterUnmount++;
        const value = typeof next === "function" ? next(slots[index]) : next;
        if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !equalDeps(slots[index].deps, deps)) slots[index] = { deps, value: callback() };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !equalDeps(slots[index].deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: callback() };
      });
    },
  };
  const batch = () => ({ id: params.batchId, name: `Private ${params.batchId} class`, status: "APPROVED", subject: "Biology", deliveryMode: "ONLINE", teacher: "Teacher", examYear: "2026" });
  const assessment = (id = "quiz-1", title = "Current private quiz") => ({ id, title, totalMarks: 10, assessmentType: "MCQ_QUIZ", submitted: false });
  const classroom = () => ({
    batch: batch(), materials: [{ id: "note-1", title: "Private lecture note", type: "PDF", fileUrl: "https://example.test/note.pdf" }],
    announcements: [], schedules: [], assessments: [assessment()],
  });
  const assertApproved = () => { if (!approved) throw new Error("Your teacher denied class access."); };
  const dependencies = {
    react: hooks,
    "react/jsx-runtime": { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) },
    "next/link": { default: "a" },
    "next/navigation": {
      useParams: () => params,
      usePathname: () => `/classes/${params.batchId}`,
      useSearchParams: () => new URLSearchParams({ tab }),
      useRouter: () => ({ replace(path) { tab = new URL(path, "https://example.test").searchParams.get("tab"); dirty = true; } }),
    },
    "lucide-react": new Proxy({}, { get: (_, name) => name }),
    "@/context/AuthContext": { useAuth: () => auth },
    "@/components/common/AttachmentLink": { AttachmentLink: "AttachmentLink" },
    "@/components/student/StudentQuizTakingModal": { StudentQuizTakingModal: "QuizTakingModal" },
    "@/components/student/StudentEssaySubmissionModal": { StudentEssaySubmissionModal: "EssaySubmissionModal" },
    "@/components/student/QuizResultModal": { QuizResultModal: "QuizResultModal" },
    "@/lib/utils/resultVisibility": { studentAssessmentStatus: (value) => !value.submitted ? "To do" : value.resultPublished ? "Graded" : "Awaiting results" },
    "@/lib/videoUtils": { getEmbedVideoUrl: (url) => ({ originalUrl: url, embedUrl: url, isDirectVideo: true }) },
    "@/services/classroomService": {
      getStudentClassroom: async (...args) => { calls.push({ name: "classroom", args }); assertApproved(); return classroom(); },
      getApprovedClassroomBatch: async (...args) => { calls.push({ name: "access", args }); assertApproved(); return batch(); },
    },
    "@/services/assessmentService": { assessmentService: {
      getBatchAssessments: async (...args) => { calls.push({ name: "assessments", args }); return refreshAssessments ? refreshAssessments(...args) : [assessment()]; },
    } },
  };
  const source = fs.readFileSync(new URL("../src/app/(student)/classes/[batchId]/page.tsx", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports, Date, Error, URLSearchParams, Set, window, document,
    console: { warn() {} }, alert() {}, setTimeout() {},
    require(id) { assert.ok(id in dependencies, `Unexpected import: ${id}`); return dependencies[id]; },
  });
  function cleanup() { for (const slot of slots) slot?.cleanup?.(); }
  function render() {
    cursor = 0; dirty = false;
    const page = compiled.exports.default();
    const child = page.props.children;
    if (componentKey !== undefined && componentKey !== child.key) { cleanup(); slots = []; }
    componentKey = child.key;
    tree = child.type();
    while (effects.length) effects.shift()();
  }
  async function flush() {
    for (let index = 0; index < 30; index++) { await Promise.resolve(); if (dirty && !unmounted) render(); }
  }
  return {
    calls, intervals, listeners,
    get text() { return content(tree); },
    get updatesAfterUnmount() { return updatesAfterUnmount; },
    modal(type = "QuizTakingModal") { return nodes(tree).find((node) => node.type === type); },
    async start() { render(); await flush(); },
    async click(label) {
      const action = nodes(tree).find((node) => node.type === "button" && label.test(content(node)));
      assert.ok(action, `Missing button: ${label}`); action.props.onClick(); await flush();
    },
    async refreshAccess() { for (const callback of listeners.window.get("focus") || []) callback(); await flush(); },
    async poll() { for (const { callback } of intervals.values()) callback(); await flush(); },
    async setApproved(next) { approved = next; },
    setVisible(visible) { document.visibilityState = visible ? "visible" : "hidden"; },
    async changeUser(id) { auth.user = id ? { id, studentId: `student-${id}` } : null; render(); await flush(); },
    flush,
    unmount() { cleanup(); unmounted = true; },
  };
}

test("live access revocation removes private classroom content and an open quiz; restored access starts clean", async () => {
  const page = classroomLifecycleHarness(); await page.start();
  assert.match(page.text, /Private biology class|Current private quiz/);
  await page.click(/^Start Quiz$/); assert.ok(page.modal());
  await page.setApproved(false); await page.refreshAccess();
  assert.match(page.text, /Access Restricted|teacher denied/);
  assert.doesNotMatch(page.text, /Private biology class|Current private quiz|Private lecture note/);
  assert.equal(page.modal(), undefined);
  await page.setApproved(true); await page.poll();
  assert.match(page.text, /Private biology class/); assert.match(page.text, /Current private quiz/);
  assert.equal(page.modal(), undefined); assert.equal(page.modal("QuizResultModal"), undefined);
  assert.equal(page.calls.filter(({ name }) => name === "classroom").length, 2); page.unmount();
});

test("a quiz callback from before revocation cannot restore a result after access is restored", async () => {
  const page = classroomLifecycleHarness(); await page.start(); await page.click(/^Start Quiz$/);
  const oldSuccess = page.modal().props.onSubmitSuccess;
  await page.setApproved(false); await page.refreshAccess();
  await page.setApproved(true); await page.poll();
  oldSuccess({ assessmentTitle: "Stale private result", score: 10 }); await page.flush();
  assert.equal(page.modal("QuizResultModal"), undefined);
  assert.equal(page.calls.filter(({ name }) => name === "assessments").length, 0);
  assert.match(page.text, /Current private quiz/); page.unmount();
});

test("an assessment refresh already in flight cannot overwrite a restored classroom", async () => {
  const stale = deferred();
  const page = classroomLifecycleHarness({ refreshAssessments: () => stale.promise });
  await page.start(); await page.click(/^Start Quiz$/);
  page.modal().props.onSubmitSuccess({ assessmentTitle: "Submitted quiz", score: 10 }); await page.flush();
  assert.equal(page.calls.filter(({ name }) => name === "assessments").length, 1);
  await page.setApproved(false); await page.refreshAccess();
  await page.setApproved(true); await page.poll();
  stale.resolve([{ id: "stale", title: "Stale previous-session quiz", assessmentType: "MCQ_QUIZ", totalMarks: 10 }]); await page.flush();
  assert.match(page.text, /Current private quiz/); assert.doesNotMatch(page.text, /Stale previous-session quiz/);
  assert.equal(page.modal("QuizResultModal"), undefined); page.unmount();
});

test("classroom polling skips hidden tabs and removes its timer and focus listeners on unmount", async () => {
  const page = classroomLifecycleHarness(); await page.start();
  assert.equal(page.intervals.size, 1); assert.equal([...page.intervals.values()][0].milliseconds, 30_000);
  page.setVisible(false); await page.poll(); await page.refreshAccess();
  assert.equal(page.calls.filter(({ name }) => name === "access").length, 0);
  page.setVisible(true); await page.poll();
  assert.equal(page.calls.filter(({ name }) => name === "access").length, 1);
  page.unmount();
  assert.equal(page.intervals.size, 0); assert.equal(page.listeners.window.get("focus").size, 0);
  assert.equal(page.listeners.document.get("visibilitychange").size, 0);
  await page.refreshAccess(); await page.poll();
  assert.equal(page.updatesAfterUnmount, 0);
});

test("changing the authenticated user remounts the classroom and invalidates old modal callbacks", async () => {
  const page = classroomLifecycleHarness(); await page.start(); await page.click(/^Start Quiz$/);
  const previousSuccess = page.modal().props.onSubmitSuccess;
  await page.changeUser("user-2");
  previousSuccess({ assessmentTitle: "Previous student result", score: 10 }); await page.flush();
  assert.equal(page.modal("QuizResultModal"), undefined);
  assert.equal(page.calls.filter(({ name }) => name === "classroom").length, 2);
  assert.equal(page.calls.at(-1).args[1], "student-user-2");
  await page.changeUser(null);
  assert.doesNotMatch(page.text, /Private biology class|Current private quiz/);
  assert.equal(page.modal(), undefined); page.unmount();
});
