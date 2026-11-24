import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(file, dependencies = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const compiled = { exports: {} };
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports, Date, Intl,
    require(id) { assert.ok(id in dependencies, `Unexpected import: ${id}`); return dependencies[id]; },
  });
  return compiled.exports;
}

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

async function renderDashboard(classes) {
  const slots = [], effects = [];
  let cursor = 0, dirty = false, tree;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; dirty = true; }];
    },
    useMemo(factory) { cursor++; return factory(); },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index][i]))) {
        slots[index] = deps; effects.push(callback);
      }
    },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const { DashboardOverview } = compile("src/components/student/DashboardOverview.tsx", {
    react: hooks, "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "next/link": { default: "a" },
    "lucide-react": new Proxy({}, { get: (_, name) => name }),
    "@/context/AuthContext": { useAuth: () => ({ user: { userId: "student", name: "Student" } }) },
    "@/components/common/AttachmentLink": { AttachmentLink: "a" },
    "@/services/dashboardService": { loadStudentDashboard: async () => ({
      classes, resources: [], announcements: [], profile: null, batches: [], failures: [],
    }) },
  });
  function render() {
    cursor = 0; dirty = false; tree = DashboardOverview();
    while (effects.length) effects.shift()();
  }
  render();
  for (let i = 0; i < 10; i++) { await Promise.resolve(); if (dirty) render(); }
  return nodes(tree).filter(node => node.type === "article" && node.props.className === "class-card-item")
    .map(card => ({ key: card.key, date: ["date-badge-number", "date-badge-month"].map(className =>
      content(nodes(card).find(node => node.props?.className === className))).join(" ") }));
}

test("dashboard recurring sessions render every date with unique keys stable across reordering and rollover", async () => {
  const { upcomingOccurrences } = compile("src/lib/schedules.ts");
  const definition = { id: "weekly-physics", title: "Physics", dayOfWeek: "MONDAY", effectiveDate: "2026-11-23",
    recurrence: "WEEKLY", startTime: "09:00", endTime: "10:00", mode: "ONLINE" };
  const occurrences = upcomingOccurrences([definition], new Date("2026-11-23T03:00:00Z"));
  const cards = await renderDashboard(occurrences);
  assert.equal(cards.length, 5);
  assert.deepEqual(cards.map(card => card.date), Array.from(occurrences, item => item.date));
  assert.equal(new Set(cards.map(card => card.key)).size, 5, "recurrences of one schedule need distinct React keys");
  const originalKeys = new Map(cards.map(card => [card.date, card.key]));
  const reordered = await renderDashboard([...occurrences].reverse());
  assert.deepEqual(reordered.map(card => card.date), cards.map(card => card.date).reverse());
  for (const card of reordered) assert.equal(card.key, originalKeys.get(card.date));
  const rolled = await renderDashboard(upcomingOccurrences([definition], new Date("2026-11-23T04:31:00Z")));
  assert.equal(rolled.length, 5);
  assert.equal(new Set(rolled.map(card => card.key)).size, 5);
  assert.ok(!rolled.some(card => card.date === cards[0].date));
  for (const card of rolled.filter(card => originalKeys.has(card.date))) assert.equal(card.key, originalKeys.get(card.date));
});
