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
  vm.runInNewContext(code, {
    module: compiledModule, exports: compiledModule.exports, URL, AbortController,
    require(id) { assert.ok(id in dependencies, `Unexpected import: ${id}`); return dependencies[id]; },
    ...globals,
  });
  return compiledModule.exports;
}

const item = (id = "notice-1", overrides = {}) => ({ id, type: "RESULT_PUBLISHED", title: "Results published",
  message: "Your assessment result is ready.", link: "/assessments", createdAt: "2026-11-21T08:00:00Z", read: false, readAt: null, ...overrides });
const page = (items = [item()], overrides = {}) => ({ items, unreadCount: items.filter((item) => !item.read).length,
  page: 0, size: 20, totalElements: items.length, totalPages: items.length ? 1 : 0, ...overrides });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

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

const { safeNotificationLink } = compile("src/services/notificationService.ts", { "@/lib/api": { fetchApi() {} } });

function bellHarness({ enabled = true, service = {} } = {}) {
  const slots = [], effects = [], requests = [], pushes = [], listeners = new Map(), timers = new Map();
  let cursor = 0, dirty = false, tree, nextTimer = 0, focusCount = 0, updatesAfterUnmount = 0, unmounted = false;
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
    useId() { const index = cursor++; return slots[index] ||= `panel-${index}`; },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !equalDeps(slots[index].deps, deps)) slots[index] = { deps, callback };
      return slots[index].callback;
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
  const api = {};
  const defaults = { unreadCount: async () => ({ unreadCount: 1 }), list: async () => page(),
    markRead: async (id) => item(id, { read: true, readAt: "2026-11-21T08:10:00Z" }), markAllRead: async () => ({ unreadCount: 0 }) };
  for (const name of Object.keys(defaults)) api[name] = (...args) => { requests.push({ name, args }); return (service[name] || defaults[name])(...args); };
  const addListener = (name, callback) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback); };
  const removeListener = (name, callback) => listeners.get(name)?.delete(callback);
  const document = { visibilityState: "visible", addEventListener: addListener, removeEventListener: removeListener };
  const window = { addEventListener: addListener, removeEventListener: removeListener,
    setInterval(callback, duration) { assert.equal(duration, 60_000); timers.set(++nextTimer, callback); return nextTimer; },
    clearInterval(id) { timers.delete(id); } };
  const jsx = (type, props, key) => {
    if (props.ref) props.ref.current = { contains: (target) => target?.inside === true, focus() { focusCount++; } };
    return { type, props, key };
  };
  const { NotificationBell } = compile("src/components/notifications/NotificationBell.tsx", {
    react: hooks, "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { usePathname: () => "/dashboard", useRouter: () => ({ push: (href) => pushes.push(href) }) },
    "lucide-react": new Proxy({}, { get: (_, name) => name }),
    "@/services/notificationService": { notificationService: api, safeNotificationLink },
    "./NotificationBell.module.css": { default: new Proxy({}, { get: (_, name) => name }) },
  }, { document, window });
  function render() { cursor = 0; dirty = false; tree = NotificationBell({ enabled }); while (effects.length) effects.shift()(); }
  async function flush() { for (let i = 0; i < 30; i++) { await Promise.resolve(); if (dirty && !unmounted) render(); } }
  function button(label) {
    const result = nodes(tree).find((node) => node.type === "button" && (node.props["aria-label"] === label || content(node) === label));
    assert.ok(result, `Missing action: ${label}`); return result;
  }
  return {
    requests, pushes, document, flush,
    get text() { return content(tree); },
    get updatesAfterUnmount() { return updatesAfterUnmount; },
    get focusCount() { return focusCount; },
    get timerCount() { return timers.size; },
    get open() { return !!nodes(tree).find((node) => node.props?.role === "dialog"); },
    get trigger() { return nodes(tree).find((node) => node.type === "button" && node.props["aria-haspopup"] === "dialog"); },
    async start() { render(); await flush(); },
    async toggle() { await this.trigger.props.onClick(); await flush(); },
    async click(label) { const action = button(label); assert.ok(!action.props.disabled); await action.props.onClick(); await flush(); },
    async tick() { for (const callback of timers.values()) callback(); await flush(); },
    async fire(name, event = {}) { for (const callback of listeners.get(name) || []) callback(event); await flush(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); unmounted = true; },
  };
}

test("notification requests use the authenticated API without client-supplied recipient IDs", async () => {
  const requests = [];
  const { notificationService } = compile("src/services/notificationService.ts", {
    "@/lib/api": { fetchApi: async (path, options) => { requests.push({ path, options }); } },
  });
  await notificationService.list(-3, 1000);
  await notificationService.unreadCount();
  await notificationService.markRead("id/with slash");
  await notificationService.markAllRead();
  assert.deepEqual(requests.map((request) => request.path), ["/notifications?page=0&size=50", "/notifications/unread-count", "/notifications/id%2Fwith%20slash/read", "/notifications/read-all"]);
  assert.equal(requests[2].options.method, "PATCH");
  assert.equal(requests[3].options.method, "PATCH");
});

test("notification links reject external origins, executable schemes and ambiguous paths", () => {
  for (const value of ["javascript:alert(1)", "https://evil.test", "//evil.test", "/\\evil.test", "/%2f%2fevil.test", "/x%0ay", "/ x", null]) assert.equal(safeNotificationLink(value), null);
  assert.equal(safeNotificationLink("/classes/batch-1?tab=announcements#latest"), "/classes/batch-1?tab=announcements#latest");
});

test("notifications show the real unread count and mark a notice before navigating", async () => {
  let count = 2;
  const bell = bellHarness({ service: { unreadCount: async () => ({ unreadCount: count }), list: async () => page([item()], { unreadCount: 2 }),
    markRead: async (id) => { count--; return item(id, { read: true }); } } });
  await bell.start(); assert.equal(bell.trigger.props["aria-label"], "Notifications, 2 unread");
  await bell.toggle(); assert.match(bell.text, /Results published/);
  await bell.click("Unread: Results published");
  assert.deepEqual(bell.pushes, ["/assessments"]);
  assert.equal(bell.open, false);
  assert.equal(bell.trigger.props["aria-label"], "Notifications, 1 unread");
  assert.equal(bell.requests.filter((request) => request.name === "markRead").length, 1);
  bell.unmount();
});

test("the inbox handles empty data and retries a failed initial request", async () => {
  let attempt = 0;
  const bell = bellHarness({ service: { unreadCount: async () => ({ unreadCount: 0 }), list: async () => { if (++attempt === 1) throw new Error("offline"); return page([]); } } });
  await bell.start(); await bell.toggle(); assert.match(bell.text, /Could not load notifications/);
  await bell.click("Try again"); assert.match(bell.text, /You're all caught up/);
  assert.equal(bell.trigger.props["aria-label"], "Notifications, 0 unread");
  assert.equal(bell.requests.filter((request) => request.name === "list").length, 2); bell.unmount();
});

test("load more appends unique notices and mark all read clears the count", async () => {
  let count = 2;
  const bell = bellHarness({ service: { unreadCount: async () => ({ unreadCount: count }),
    list: async (number) => page(number ? [item(), item("notice-2", { title: "Class updated" })] : [item()], { page: number, totalPages: 2, totalElements: 2, unreadCount: 2 }),
    markAllRead: async () => { count = 0; return { unreadCount: 0 }; } } });
  await bell.start(); await bell.toggle(); await bell.click("Load more notifications");
  assert.equal((bell.text.match(/Results published/g) || []).length, 1);
  assert.match(bell.text, /Class updated/);
  await bell.click("Mark all as read");
  assert.equal(bell.trigger.props["aria-label"], "Notifications, 0 unread");
  assert.doesNotMatch(bell.text, /Load more notifications/); bell.unmount();
});

test("failed read actions keep notifications unread and do not navigate", async () => {
  const bell = bellHarness({ service: { markRead: async () => { throw new Error("network failure"); } } });
  await bell.start(); await bell.toggle(); await bell.click("Unread: Results published");
  assert.match(bell.text, /Could not mark this notification/);
  assert.equal(bell.open, true); assert.deepEqual(bell.pushes, []);
  assert.equal(bell.trigger.props["aria-label"], "Notifications, 1 unread"); bell.unmount();
});

test("background polling pauses while hidden, avoids overlap, and stops on unmount", async () => {
  const pending = deferred();
  const bell = bellHarness({ service: { unreadCount: () => pending.promise } });
  await bell.start(); await bell.tick(); await bell.fire("focus");
  assert.equal(bell.requests.length, 1, "Only one unread count request can be in flight");
  pending.resolve({ unreadCount: 3 }); await bell.flush();
  bell.document.visibilityState = "hidden"; await bell.tick(); await bell.fire("focus");
  assert.equal(bell.requests.length, 1);
  bell.document.visibilityState = "visible"; await bell.fire("visibilitychange");
  assert.equal(bell.requests.length, 2);
  bell.unmount(); assert.equal(bell.timerCount, 0); await bell.fire("focus");
  assert.equal(bell.requests.length, 2);
});

test("aborted and stale responses cannot overwrite a read mutation or update an unmounted inbox", async () => {
  const stale = deferred(), late = deferred(); let count = 1, countRequests = 0;
  const bell = bellHarness({ service: {
    unreadCount: async () => (++countRequests === 2 ? stale.promise : { unreadCount: count }),
    markAllRead: async () => { count = 0; return { unreadCount: 0 }; },
    list: async () => page(),
  } });
  await bell.start(); await bell.toggle(); await bell.fire("focus");
  await bell.click("Mark all as read"); stale.resolve({ unreadCount: 99 }); await bell.flush();
  assert.equal(bell.trigger.props["aria-label"], "Notifications, 0 unread"); bell.unmount();
  const closing = bellHarness({ service: { list: () => late.promise } });
  await closing.start(); await closing.toggle(); closing.unmount(); late.resolve(page()); await closing.flush();
  assert.equal(closing.updatesAfterUnmount, 0);
});

test("Escape and outside clicks dismiss the inbox and unauthenticated portals do not poll", async () => {
  const bell = bellHarness(); await bell.start(); await bell.toggle();
  let prevented = false;
  await bell.fire("keydown", { key: "Escape", preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(bell.open, false); assert.ok(bell.focusCount >= 2);
  await bell.toggle(); await bell.fire("pointerdown", { target: { inside: false } }); assert.equal(bell.open, false); bell.unmount();
  const signedOut = bellHarness({ enabled: false }); await signedOut.start(); await signedOut.tick(); await signedOut.fire("focus");
  assert.equal(signedOut.requests.length, 0); assert.equal(signedOut.timerCount, 0); assert.equal(signedOut.trigger.props.disabled, true); signedOut.unmount();
});
