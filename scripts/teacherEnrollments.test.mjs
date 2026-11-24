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
    module: compiledModule, exports: compiledModule.exports, Error, Date, AbortController,
    console: { error() {}, warn() {} },
    require(id) { assert.ok(id in dependencies, `Unexpected import: ${id}`); return dependencies[id]; },
  });
  return compiledModule.exports;
}

function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

function content(node) {
  if (Array.isArray(node)) return node.map(content).join("");
  if (node && typeof node === "object") return content(node.props?.children);
  return node === undefined || node === null || typeof node === "boolean" ? "" : String(node);
}

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

const pendingRequest = (id, overrides = {}) => ({
  id, studentId: `student-${id}`, batchId: "batch-biology", status: "PENDING", accessGranted: false, batchActive: true, createdAt: "2026-11-21T08:00:00Z",
  studentName: "Nimali Perera", studentNumber: "STU-026", batchName: "Biology November", subject: "Biology", ...overrides,
});

function enrollmentHarness(service = {}) {
  const slots = [], effects = [], requests = [];
  let cursor = 0, dirty = false, tree, unmounted = false, updatesAfterUnmount = 0;
  const equalDeps = (left, right) => left?.length === right?.length && left.every((value, index) => Object.is(value, right[index]));
  const hooks = {
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
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !equalDeps(slots[index].deps, deps)) slots[index] = { deps, value: callback };
      return slots[index].value;
    },
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
    useEffectEvent(callback) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { event: (...args) => slots[index].callback(...args) };
      slots[index].callback = callback;
      return slots[index].event;
    },
  };
  const defaults = {
    getTeacherEnrollmentRequests: async () => [pendingRequest("request-1")],
    setStudentClassAccess: async (_, allowed) => ({ message: allowed ? "Allowed" : "Denied", accessGranted: allowed }),
  };
  const api = {};
  for (const name of Object.keys(defaults)) api[name] = (...args) => {
    requests.push({ name, args });
    return (service[name] || defaults[name])(...args);
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const { default: EnrollmentPage } = compile("src/app/teacher/enrollments/page.tsx", {
    react: hooks,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "next/link": { default: "a" },
    "lucide-react": new Proxy({}, { get: (_, name) => name }),
    "@/services/teacherService": api,
  });
  function render() {
    cursor = 0; dirty = false; tree = EnrollmentPage();
    while (effects.length) effects.shift()();
  }
  async function flush() {
    for (let i = 0; i < 30; i++) { await Promise.resolve(); if (dirty && !unmounted) render(); }
  }
  function action(label, within = tree) {
    const result = nodes(within).find((node) => node.type === "button" && label.test(`${node.props["aria-label"] || ""} ${content(node)}`));
    assert.ok(result, `Missing action: ${label}`);
    return result;
  }
  function row(studentName) {
    const matches = nodes(tree).filter((node) => content(node).includes(studentName)
      && nodes(node).some((child) => child.type === "button" && /allow access|deny access/i.test(content(child))));
    assert.ok(matches.length, `Missing request for ${studentName}`);
    return matches.at(-1);
  }
  return {
    requests, action, row, flush,
    get text() { return content(tree); },
    get updatesAfterUnmount() { return updatesAfterUnmount; },
    get inputs() { return nodes(tree).filter((node) => node.type === "input"); },
    get selects() { return nodes(tree).filter((node) => node.type === "select"); },
    async start() { render(); await flush(); },
    async click(label, within) { const button = action(label, within); assert.ok(!button.props.disabled); await button.props.onClick(); await flush(); },
    async change(input, value) { input.props.onChange({ target: { value } }); await flush(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); unmounted = true; },
  };
}

test("teacher enrollment management displays server requests rather than student enrollment cards", async () => {
  const page = enrollmentHarness(); await page.start();
  assert.equal(page.requests.filter((request) => request.name === "getTeacherEnrollmentRequests").length, 1);
  for (const value of ["Nimali Perera", "STU-026", "Biology November", "Biology"]) assert.ok(page.text.includes(value));
  assert.doesNotMatch(page.text, /Enroll Now|Enroll in Classes|Mr\. K\. Perera|A\/L Batch A|View Class Page & Educator Profile/);
  assert.ok(page.action(/allow access/i)); assert.ok(page.action(/deny access/i)); page.unmount();
});

for (const allowed of [true, false]) {
  test(`teacher ${allowed ? "allow" : "deny"} sends the request ID and updates only the resolved request`, async () => {
    const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => [pendingRequest("request-1"), pendingRequest("request-2", { studentName: "Kamal Silva", studentNumber: "STU-099" })] });
    await page.start(); await page.click(allowed ? /allow access/i : /deny access/i, page.row("Nimali Perera"));
    const mutations = page.requests.filter((request) => request.name === "setStudentClassAccess");
    assert.equal(mutations.length, 1); assert.deepEqual(mutations[0].args, ["request-1", allowed]);
    assert.doesNotMatch(page.text, /STU-026/);
    assert.match(page.text, /Kamal Silva/);
    await page.click(/^ All students/i);
    assert.match(page.text, /STU-026/); assert.match(page.text, /Kamal Silva/);
    assert.equal(page.action(allowed ? /allow access/i : /deny access/i, page.row("Nimali Perera")).props.disabled, true);
    page.unmount();
  });
}

test("a failed enrollment decision retains the request and permits a retry", async () => {
  let attempt = 0;
  const page = enrollmentHarness({ setStudentClassAccess: async () => {
    if (++attempt === 1) throw new Error("Class access could not be allowed. Please retry.");
    return { message: "Allowed", accessGranted: true };
  } });
  await page.start(); await page.click(/allow access/i, page.row("Nimali Perera"));
  assert.match(page.text, /could not|try again|retry/i);
  assert.match(page.text, /STU-026/);
  await page.click(/allow access/i, page.row("Nimali Perera"));
  assert.equal(attempt, 2); assert.doesNotMatch(page.text, /STU-026/); page.unmount();
});

test("an in-flight decision ignores double clicks and blocks the opposing action", async () => {
  const pending = deferred();
  const page = enrollmentHarness({ setStudentClassAccess: () => pending.promise }); await page.start();
  const refresh = page.action(/refresh requests/i);
  const approve = page.action(/allow access/i, page.row("Nimali Perera"));
  const first = approve.props.onClick(); const repeated = approve.props.onClick();
  await page.flush();
  assert.equal(page.requests.filter((request) => request.name === "setStudentClassAccess").length, 1);
  assert.equal(page.action(/deny access/i, page.row("Nimali Perera")).props.disabled, true);
  assert.equal(page.action(/refresh requests/i).props.disabled, true);
  refresh.props.onClick(); await page.flush();
  assert.equal(page.requests.filter((request) => request.name === "getTeacherEnrollmentRequests").length, 1, "A stale refresh handler must not race an enrollment decision");
  pending.resolve({ message: "Allowed", accessGranted: true }); await Promise.all([first, repeated]); await page.flush();
  assert.doesNotMatch(page.text, /STU-026/); page.unmount();
});

test("teachers can search student details and filter requests by their class", async () => {
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => [pendingRequest("request-1"), pendingRequest("request-2", {
    studentName: "Kamal Silva", studentNumber: "STU-099", batchId: "batch-chemistry", batchName: "Chemistry January", subject: "Chemistry",
  })] });
  await page.start(); const search = page.inputs[0]; assert.ok(search);
  for (const query of ["nimali", "stu-026", "biology november", "biology"]) {
    await page.change(page.inputs[0], query);
    assert.match(page.text, /Nimali Perera/); assert.doesNotMatch(page.text, /Kamal Silva/);
  }
  await page.change(page.inputs[0], "");
  assert.equal(page.selects.length, 1); await page.change(page.selects[0], "batch-chemistry");
  assert.match(page.text, /Kamal Silva/); assert.doesNotMatch(page.text, /Nimali Perera/);
  await page.change(page.inputs[0], "no matching student");
  assert.doesNotMatch(page.text, /Nimali Perera|Kamal Silva/); assert.match(page.text, /no .*match|no .*found/i); page.unmount();
});

test("an initial loading error offers retry and empty requests never fabricate student enrollment cards", async () => {
  let attempt = 0;
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => {
    if (++attempt === 1) throw new Error("Offline"); return [];
  } });
  await page.start(); assert.match(page.text, /could not|unable|failed|offline/i);
  await page.click(/try again|retry/i); assert.equal(attempt, 2);
  assert.match(page.text, /no pending|no enrollment|all caught up/i);
  assert.doesNotMatch(page.text, /Enroll Now|A\/L Batch|Mr\. K\. Perera/); page.unmount();
});

test("requests resolving after the page unmounts cannot update its state", async () => {
  const pending = deferred();
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: () => pending.promise });
  await page.start(); page.unmount(); pending.resolve([pendingRequest("request-1")]); await page.flush();
  assert.equal(page.requests[0].args[0].aborted, true);
  assert.equal(page.updatesAfterUnmount, 0);
});

test("an older refresh cannot replace the latest enrollment requests", async () => {
  const stale = deferred(), latest = deferred(); let calls = 0;
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: () => {
    calls++;
    return calls === 1 ? Promise.resolve([pendingRequest("request-1")]) : calls === 2 ? stale.promise : latest.promise;
  } });
  await page.start(); const refresh = page.action(/refresh requests/i);
  refresh.props.onClick(); refresh.props.onClick(); await page.flush();
  assert.equal(page.requests[1].args[0].aborted, true);
  latest.resolve([pendingRequest("request-2", { studentName: "Kamal Silva", studentNumber: "STU-099" })]); await page.flush();
  stale.resolve([pendingRequest("request-1")]); await page.flush();
  assert.match(page.text, /Kamal Silva/); assert.doesNotMatch(page.text, /Nimali Perera|STU-026/);
  assert.equal(page.action(/refresh requests/i).props.disabled, false); page.unmount();
});

test("resolved requests remain manageable in their access filters without appearing as pending", async () => {
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => [pendingRequest("request-1", { status: "APPROVED", accessGranted: true }),
    pendingRequest("request-2", { status: "REJECTED", studentName: "Kamal Silva" })] });
  await page.start(); assert.match(page.text, /No pending enrollment requests/);
  assert.doesNotMatch(page.text, /Nimali Perera|Kamal Silva|STU-026/);
  await page.click(/^ Allowed/i); assert.match(page.text, /Nimali Perera/); assert.doesNotMatch(page.text, /Kamal Silva/);
  assert.equal(page.action(/allow access/i, page.row("Nimali Perera")).props.disabled, true);
  await page.click(/^ Denied/i); assert.match(page.text, /Kamal Silva/); assert.doesNotMatch(page.text, /Nimali Perera/);
  assert.equal(page.action(/deny access/i, page.row("Kamal Silva")).props.disabled, true);
  assert.equal(page.requests.length, 1); page.unmount();
});

test("teachers can revoke previously allowed access and restore denied access without losing the row", async () => {
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => [pendingRequest("request-1", { status: "APPROVED", accessGranted: true })] });
  await page.start(); await page.click(/^ All students/i);
  await page.click(/deny access/i, page.row("Nimali Perera"));
  assert.match(content(page.row("Nimali Perera")), /Denied/);
  assert.equal(page.action(/deny access/i, page.row("Nimali Perera")).props.disabled, true);
  await page.click(/allow access/i, page.row("Nimali Perera"));
  assert.match(content(page.row("Nimali Perera")), /Allowed/);
  assert.equal(page.action(/allow access/i, page.row("Nimali Perera")).props.disabled, true);
  assert.deepEqual(page.requests.filter((request) => request.name === "setStudentClassAccess").map((request) => request.args), [["request-1", false], ["request-1", true]]);
  assert.match(page.text, /0 pending · 1 allowed · 0 denied/); page.unmount();
});

test("the server response determines the access status after an update", async () => {
  const page = enrollmentHarness({ setStudentClassAccess: async () => ({ message: "Denied", accessGranted: false }) });
  await page.start(); await page.click(/^ All students/i);
  await page.click(/allow access/i, page.row("Nimali Perera"));
  assert.match(content(page.row("Nimali Perera")), /Denied/);
  assert.match(page.text, /Class access denied/); page.unmount();
});

test("inactive classes explain unavailable access and still let teachers revoke an existing approval", async () => {
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => [pendingRequest("request-1", { status: "APPROVED", accessGranted: false, batchActive: false })] });
  await page.start(); await page.click(/^ All students/i);
  assert.match(content(page.row("Nimali Perera")), /Class inactive/);
  assert.equal(page.action(/allow access/i, page.row("Nimali Perera")).props.disabled, true);
  assert.equal(page.action(/deny access/i, page.row("Nimali Perera")).props.disabled, false);
  await page.click(/deny access/i, page.row("Nimali Perera"));
  assert.equal(page.action(/deny access/i, page.row("Nimali Perera")).props.disabled, true); page.unmount();
});

test("teacher access service targets the teacher queue and sends an explicit allowed flag", async () => {
  const calls = [];
  const service = compile("src/services/teacherService.ts", { "@/lib/api": { fetchApi: async (...args) => { calls.push(args); return {}; } } });
  const controller = new AbortController();
  await service.getTeacherEnrollmentRequests(controller.signal);
  await service.setStudentClassAccess("request/one", false);
  assert.equal(calls[0][0], "/enrollments/teacher/requests"); assert.equal(calls[0][1].signal, controller.signal);
  assert.equal(calls[1][0], "/enrollments/teacher/requests/request%2Fone/access");
  assert.equal(calls[1][1].method, "PUT"); assert.equal(calls[1][1].body, '{"allowed":false}');
});

test("one access decision synchronizes legacy duplicate requests for the same student and class", async () => {
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => [pendingRequest("request-1"),
    pendingRequest("duplicate", { studentId: "student-request-1", studentName: "Nimali Duplicate" }),
    pendingRequest("different-class", { studentId: "student-request-1", studentName: "Nimali Other Class", batchId: "chemistry" })] });
  await page.start(); await page.click(/^ All students/i);
  await page.click(/allow access/i, page.row("Nimali Perera"));
  assert.match(content(page.row("Nimali Duplicate")), /Allowed/);
  assert.match(content(page.row("Nimali Other Class")), /Pending review/);
  assert.match(page.text, /1 pending · 2 allowed · 0 denied/); page.unmount();
});

test("inconsistent legacy rejected requests with effective access can still be revoked", async () => {
  const page = enrollmentHarness({ getTeacherEnrollmentRequests: async () => [pendingRequest("request-1", { status: "REJECTED", accessGranted: true })] });
  await page.start(); await page.click(/^ All students/i);
  assert.equal(page.action(/deny access/i, page.row("Nimali Perera")).props.disabled, false);
  await page.click(/deny access/i, page.row("Nimali Perera"));
  assert.equal(page.action(/deny access/i, page.row("Nimali Perera")).props.disabled, true); page.unmount();
});
