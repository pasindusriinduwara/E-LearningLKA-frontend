import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(file, dependencies) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
  } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(code, {
    module: compiledModule, exports: compiledModule.exports, Error,
    console: { error() {}, warn() {} },
    require(id) {
      assert.ok(id in dependencies, `Unexpected import: ${id}`);
      return dependencies[id];
    },
  });
  return compiledModule.exports;
}

function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  if (node && typeof node === "object") return text(node.props?.children);
  return node === undefined || node === null || typeof node === "boolean" ? "" : String(node);
}

const ownedBatches = [
  { id: "owned-batch-1", name: "My Biology Class" },
  { id: "owned-batch-2", name: "My Chemistry Class" },
];

// Render the real components with deterministic effects and controlled network responses.
// The public batch endpoint deliberately returns another teacher's batch if it is called.
function editorHarness(kind, { saveError } = {}) {
  const slots = [], effects = [], payloads = [], publicRequests = [];
  let cursor = 0, dirty = false, tree, teacherBatchRequests = 0, saved = 0, cancelled = 0;
  let resolveBatches, rejectBatches;
  const batchRequest = new Promise((resolve, reject) => { resolveBatches = resolve; rejectBatches = reject; });
  const equalDeps = (left, right) => left?.length === right?.length && left.every((value, index) => Object.is(value, right[index]));
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
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !equalDeps(slots[index].deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: callback() };
      });
    },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const componentName = kind === "quiz" ? "QuizReviewStudio" : "CreateAssignmentForm";
  const exports = compile(`src/components/assignments/${componentName}.tsx`, {
    react: hooks,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "lucide-react": new Proxy({}, { get: (_, name) => name }),
    "next/link": { default: "a" },
    "@/components/common/AttachmentLink": { AttachmentLink: "AttachmentLink" },
    "@/services/teacherService": { getTeacherBatches() { teacherBatchRequests++; return batchRequest; } },
    "@/lib/api": { async fetchApi(path) {
      publicRequests.push(path);
      return [{ id: "another-teachers-batch", name: "Other Teacher's Class" }];
    } },
    "@/services/assessmentService": { assessmentService: { async saveQuiz(payload) {
      payloads.push(payload);
      if (saveError) throw saveError;
      return { id: "saved-assessment" };
    } } },
  });
  const props = {
    onCancel() { cancelled++; }, onSuccess() { saved++; }, onSaved() { saved++; },
    initialTitle: "Imported assessment",
    initialQuestions: [{ id: "question-1", questionNumber: 1, questionText: "Which planet is red?", marks: 1,
      hasCorrectAnswer: true, confidence: 1, options: [
        { label: "A", text: "Venus", isCorrect: false },
        { label: "B", text: "Mars", isCorrect: true },
      ] }],
  };
  function render() {
    cursor = 0; dirty = false;
    tree = exports[componentName](props);
    while (effects.length) effects.shift()();
  }
  async function flush() {
    for (let i = 0; i < 20; i++) { await Promise.resolve(); if (dirty) render(); }
  }
  function find(predicate) { return nodes(tree).find(predicate); }
  function publishButton() {
    const button = find((node) => node.type === "button" && /Publish to LMS|Publish Assignment/.test(text(node)));
    assert.ok(button, "The publish action must remain visible");
    return button;
  }
  function batchSelect() {
    const selects = nodes(tree).filter((node) => node.type === "select");
    assert.equal(selects.length, 1, "The editor must expose a target batch selector");
    return selects[0];
  }
  return {
    payloads, publicRequests,
    get teacherBatchRequests() { return teacherBatchRequests; },
    get saved() { return saved; },
    get cancelled() { return cancelled; },
    get content() { return text(tree); },
    publishButton, batchSelect,
    options() { return nodes(batchSelect()).filter((node) => node.type === "option"); },
    input(predicate) { const input = find(predicate); assert.ok(input); return input; },
    async start() { render(); await flush(); },
    async resolveBatches(batches) { resolveBatches(batches); await flush(); },
    async failBatches() { rejectBatches(new Error("Teacher batches could not be loaded")); await flush(); },
    async chooseBatch(value) { batchSelect().props.onChange({ target: { value } }); await flush(); },
    async change(input, value) { input.props.onChange({ target: { value } }); await flush(); },
    async submit({ force = false } = {}) {
      const button = publishButton();
      if (!force) assert.ok(!button.props.disabled, "The publish action should be available");
      if (kind === "quiz") await button.props.onClick();
      else await find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
      await flush();
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

for (const kind of ["quiz", "assignment"]) {
  test(`${kind}: only teacher-owned batches are offered and the selected owned ID is saved`, async () => {
    const editor = editorHarness(kind); await editor.start();
    assert.equal(editor.teacherBatchRequests, 1);
    assert.deepEqual(editor.publicRequests, []);
    assert.ok(editor.publishButton().props.disabled, "Do not publish while permissions are loading");
    await editor.submit({ force: true });
    assert.equal(editor.payloads.length, 0, "The submit handler must guard an unresolved batch request");
    await editor.resolveBatches(ownedBatches);
    assert.deepEqual(editor.options().filter((option) => option.props.value).map((option) => option.props.value), ownedBatches.map((batch) => batch.id));
    await editor.chooseBatch("owned-batch-2");
    if (kind === "assignment") await editor.change(editor.input((node) => node.type === "input" && node.props.type === "text"), "Chemistry paper");
    await editor.submit();
    assert.equal(editor.payloads.length, 1);
    assert.equal(editor.payloads[0].batchId, "owned-batch-2");
    assert.equal(editor.saved, 1);
    editor.unmount();
  });

  for (const response of ["empty", "failure"]) {
    test(`${kind}: ${response} teacher-batch loading cannot fabricate a batch or submit`, async () => {
      const editor = editorHarness(kind); await editor.start();
      if (response === "empty") await editor.resolveBatches([]);
      else await editor.failBatches();
      assert.equal(editor.teacherBatchRequests, 1);
      assert.deepEqual(editor.publicRequests, []);
      assert.ok(editor.publishButton().props.disabled);
      assert.ok(editor.batchSelect().props.disabled);
      assert.ok(editor.options().every((option) => !option.props.value));
      assert.doesNotMatch(editor.content, /A\/L 2026 Batch A \(Default\)|Other Teacher's Class/);
      assert.match(editor.content, response === "empty" ? /no (?:assigned |available |active )?batches|no batches.*assigned|not assigned.*batch/i : /could not.*load|unable to load|failed to load|cannot load/i);
      if (kind === "assignment") await editor.change(editor.input((node) => node.type === "input" && node.props.type === "text"), "My draft paper");
      await editor.submit({ force: true });
      assert.equal(editor.payloads.length, 0);
      assert.equal(editor.saved, 0);
      assert.equal(editor.cancelled, 0);
      editor.unmount();
    });
  }

  test(`${kind}: a selection outside the loaded teacher batches is rejected before saving`, async () => {
    const editor = editorHarness(kind); await editor.start(); await editor.resolveBatches(ownedBatches);
    if (kind === "assignment") await editor.change(editor.input((node) => node.type === "input" && node.props.type === "text"), "My paper");
    await editor.chooseBatch("another-teachers-batch");
    await editor.submit({ force: true });
    assert.equal(editor.payloads.length, 0);
    assert.equal(editor.saved, 0);
    editor.unmount();
  });
}

test("quiz: a permission rejection retains the edited draft and reports the backend error inline", async () => {
  const message = "You do not have permission to create assessments for this batch";
  const editor = editorHarness("quiz", { saveError: new Error(message) });
  await editor.start(); await editor.resolveBatches(ownedBatches); await editor.chooseBatch("owned-batch-2");
  await editor.change(editor.input((node) => node.type === "input" && node.props.type === "text"), "My edited imported quiz");
  await editor.change(editor.input((node) => node.type === "textarea" && node.props.placeholder === "Enter question prompt..."), "My edited question prompt");
  await editor.submit();
  assert.equal(editor.payloads.length, 1);
  assert.equal(editor.saved, 0);
  assert.equal(editor.cancelled, 0);
  assert.equal(editor.input((node) => node.type === "input" && node.props.type === "text").props.value, "My edited imported quiz");
  assert.equal(editor.input((node) => node.type === "textarea" && node.props.placeholder === "Enter question prompt...").props.value, "My edited question prompt");
  assert.equal(editor.batchSelect().props.value, "owned-batch-2");
  assert.ok(editor.content.includes(message));
  assert.ok(!editor.publishButton().props.disabled, "The draft must remain available for correction or retry");
  editor.unmount();
});
