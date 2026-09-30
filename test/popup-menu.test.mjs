// popup-menu 收养 adapter 的关闭纪律：菜单外滚动 = 关、菜单内滚动不关、外点关。created 2026-09-30 by Claude Fable 5.1（0.1.1：滚动收菜单）。
// 事件假件：在 dom-mini 的元素之上加 addEventListener / dispatch（只装 _mount 摸到的：document capture 监听、window resize、classList、contains）。
import { test, eq, assert, tick } from "./runner.mjs";
// 全局 DOM 假件由 anchored-popup.test.mjs 先装（run.mjs 里在前；safeTop=20），这里只叠事件总线，不重装（重装会把它的 safeTop 冲掉）。
const mk = (over = {}) => ({ style: {}, offsetWidth: 0, offsetHeight: 0, remove() {}, getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }), ...over });
const listeners = new Map();   // "document:scroll" → Set<fn>
const bus = (name) => ({
  addEventListener(type, fn) { const k = `${name}:${type}`; if (!listeners.has(k)) listeners.set(k, new Set()); listeners.get(k).add(fn); },
  removeEventListener(type, fn) { listeners.get(`${name}:${type}`)?.delete(fn); },
});
const dispatch = (name, type, ev) => { for (const fn of [...(listeners.get(`${name}:${type}`) ?? [])]) fn(ev); };
Object.assign(globalThis.document, bus("document"));
Object.assign(globalThis.window, bus("window"));
const node = (over = {}) => {
  const classes = new Set(); const kids = [];
  return mk({
    classList: { add: (...c) => c.forEach((x) => classes.add(x)), remove: (...c) => c.forEach((x) => classes.delete(x)), contains: (c) => classes.has(c) },
    setAttribute() {}, querySelectorAll: () => [], parentElement: globalThis.document.body,
    contains(n) { return n === this || kids.includes(n); }, adopt(n) { kids.push(n); return n; },
    offsetWidth: 120, offsetHeight: 80, ...over,
  });
};
const { openAdoptedPopup, isPopupOpen } = await import("../src/index.ts");

test("[popup-menu] 菜单外滚动 → 关（菜单是 fixed 的，锚一滚就漂在半空）；菜单内滚动 → 不关；外点 → 关", async () => {
  const anchor = node({ getBoundingClientRect: () => ({ top: 100, left: 300, right: 340, bottom: 130, width: 40, height: 30 }) });
  const menu = node(); const inner = menu.adopt(node()); const elsewhere = node();
  let closed = 0;
  const h = openAdoptedPopup(menu, { anchor, band: "css", onClose: () => closed++ });
  assert(h.isOpen && isPopupOpen(menu) && !menu.classList.contains("hidden"), "打开后可见");
  await tick();   // 监听延后一拍才挂（打开菜单的那一击不能反过来关掉它）
  dispatch("document", "scroll", { target: inner });
  assert(h.isOpen, "菜单内部滚动不关");
  dispatch("document", "scroll", { target: elsewhere });
  assert(!h.isOpen && menu.classList.contains("hidden") && closed === 1, "菜单外滚动 → 关 + hidden + onClose");
  eq(listeners.get("document:scroll")?.size ?? 0, 0, "关了之后 scroll 监听摘掉");
  const h2 = openAdoptedPopup(menu, { anchor, band: "css", onClose: () => closed++ });
  await tick();
  dispatch("document", "pointerdown", { composedPath: () => [elsewhere, globalThis.document.body], stopPropagation() {}, preventDefault() {} });
  assert(!h2.isOpen && closed === 2, "外点 → 关");
});
