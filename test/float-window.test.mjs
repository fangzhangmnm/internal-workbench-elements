// float-window（0.2.0 浮窗的壳）：钳制、顶 / 底地板、改大小先缩再挪、显隐两种、z 序、临时藏窗、壳零件（点和拖怎么分、收起和恢复、闲置淡出、斜纹角改大小）、拆干净。
// created 2026-11-11 by Claude Opus 5.5（CatsUp 施工单十七）。
// 全局 DOM 假件由 anchored-popup.test.mjs 先装（800 × 600、safeTop 20），popup-menu.test.mjs 叠了 window 的事件总线；这里不重装，
// 只在每条测试里临时换 document.createElement（库建圆钮 / 斜纹角要的元素）和计时器 / matchMedia，测完还原。
import { test, eq, assert } from "./runner.mjs";

/** 够库用的一个元素：类名、属性、子元素、事件（按 capture 分开记）、尺寸（行内宽高 > 自己的默认；收起 = 44；藏着 = 0）、位置 = 行内 left / top。 */
function node(tag = "div", init = {}) {
  const classes = new Set(), kids = [], ls = [], attrs = {};
  const n = {
    tagName: tag.toUpperCase(), style: {}, hidden: false, dataset: {}, innerHTML: "", title: "", type: "", children: kids,
    w: init.w ?? 0, h: init.h ?? 0,
    get offsetWidth() { return n.hidden ? 0 : classes.has("wbe-float-collapsed") ? 44 : parseFloat(n.style.width) || n.w; },
    get offsetHeight() { return n.hidden ? 0 : classes.has("wbe-float-collapsed") ? 44 : parseFloat(n.style.height) || n.h; },
    getBoundingClientRect() { const left = parseFloat(n.style.left) || 0, top = parseFloat(n.style.top) || 0, width = n.offsetWidth, height = n.offsetHeight; return { left, top, right: left + width, bottom: top + height, width, height }; },
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)), remove: (...c) => c.forEach((x) => classes.delete(x)), contains: (c) => classes.has(c),
      toggle: (c, on) => { const v = on ?? !classes.has(c); if (v) classes.add(c); else classes.delete(c); return v; },
    },
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); for (const c of String(v).split(/\s+/).filter(Boolean)) classes.add(c); },
    setAttribute(k, v) { attrs[k] = String(v); }, getAttribute(k) { return attrs[k] ?? null; },
    appendChild(c) { kids.push(c); return c; }, remove() {},
    addEventListener(type, fn, opts) { ls.push({ type, fn, cap: typeof opts === "object" ? !!opts?.capture : !!opts }); },
    removeEventListener(type, fn, opts) { const cap = typeof opts === "object" ? !!opts?.capture : !!opts; const i = ls.findIndex((l) => l.type === type && l.fn === fn && l.cap === cap); if (i >= 0) ls.splice(i, 1); },
    fire(type, ev = {}) { for (const l of [...ls]) if (l.type === type) l.fn({ type, pointerId: 1, clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {}, target: n, ...ev }); },
    listenerCount: () => ls.length,
    setPointerCapture() {}, releasePointerCapture() {},
    find: (cls) => kids.find((k) => k.classList.contains(cls)) ?? null,
  };
  return n;
}

const {
  registerFloatingWindow, configureFloatWindows, floatingTopFloor, computeTopFloor, raiseFloatingWindow,
  suppressFloatingForTransient, restoreFloatingAfterTransient, floatingWindowStack,
} = await import("../src/index.ts");
const { isKnobDrag, SHELL_KNOB_DRAG_PX, SHELL_IDLE_MS } = await import("../src/float-window.ts");

/** 一条测试的环境：createElement 出 node、计时器手拨、可选 hover 设备；结束还原。 */
async function withEnv(opts, fn) {
  const doc = globalThis.document, oldCreate = doc.createElement, oldST = globalThis.setTimeout, oldCT = globalThis.clearTimeout, oldMM = globalThis.matchMedia;
  const timers = new Map(); let seq = 0;
  doc.createElement = (tag) => node(tag);
  if (opts.fakeTimers) { globalThis.setTimeout = (f, ms) => { const id = ++seq; timers.set(id, { f, ms }); return id; }; globalThis.clearTimeout = (id) => { timers.delete(id); }; }
  if (opts.hover !== undefined) globalThis.matchMedia = () => ({ matches: opts.hover });
  configureFloatWindows({ hudBottom: () => null });   // 顶地板 = 安全区 20 + 死区 24 = 44（不受别的测试配的 floors 影响）
  const fire = () => { const all = [...timers.values()]; timers.clear(); for (const t of all) t.f(); return all.map((t) => t.ms); };
  try { await fn({ fire, timers }); }
  finally { doc.createElement = oldCreate; globalThis.setTimeout = oldST; globalThis.clearTimeout = oldCT; if (oldMM === undefined) delete globalThis.matchMedia; else globalThis.matchMedia = oldMM; }
}

test("[float-window] 顶地板 = max(安全区 + 24, 顶排下缘 + 4)；宿主给的顶排下缘生效", () => withEnv({}, () => {
  eq(computeTopFloor(20, null), 44); eq(computeTopFloor(20, 100), 104); eq(computeTopFloor(0, 10), 24);
  eq(floatingTopFloor(), 44, "顶排不可见");
  configureFloatWindows({ hudBottom: () => 90 }); eq(floatingTopFloor(), 94, "宿主的顶排下缘 90 + 4");
}));

test("[float-window] 不开壳 = 老样子：开窗钳进视口（拖把不进顶地板）、hidden 属性显隐、回声、没有壳的类和零件", () => withEnv({}, () => {
  const el = node("div", { w: 300, h: 200 }); el.hidden = true; el.style.left = "-50px"; el.style.top = "5px";
  const echo = [];
  const h = registerFloatingWindow(el, { id: "t-plain", onOpenChange: (o) => echo.push(o) });
  h.open();
  eq(el.hidden, false); eq(el.style.left, "0px"); eq(el.style.top, "44px");
  assert(!el.classList.contains("wbe-float-shell") && el.children.length === 0, "没开壳 = 不加类、不建零件");
  eq(h.collapsed(), false); h.setCollapsed(true); eq(h.collapsed(), false, "没有 collapsible = 收不起来");
  h.close(); eq(el.hidden, true); eq(echo.join(","), "true,false");
  h.dispose();
}));

test("[float-window] 底地板：恢复 / 钳制让出屏底被占掉的高度（抽屉 / 键盘）", () => withEnv({}, () => {
  const el = node("div", { w: 300, h: 200 }); el.hidden = true;
  let floor = 100;
  const h = registerFloatingWindow(el, { id: "t-floor", bottomFloor: () => floor });
  h.open(); h.restore({ left: 0, top: 550 });
  eq(el.style.top, "300px", "600 - 100 - 200");
  floor = 0; h.restore({ left: 0, top: 550 }); eq(el.style.top, "400px", "抽屉收了 = 600 - 200");
  h.dispose();
}));

test("[float-window] 能改大小的窗比能用的地方还大 = 先缩到放得下（不小于最小值）再挪；只改宽的（axis x）不碰高", () => withEnv({}, () => {
  const el = node("div", { w: 300, h: 200 }); el.hidden = true; el.style.width = "2000px"; el.style.height = "900px";
  const h = registerFloatingWindow(el, { id: "t-shrink", resize: { grip: null, min: { w: 100, h: 80 } } });
  h.open();
  eq(el.style.width, "784px", "800 - 2 × 8"); eq(el.style.height, "548px", "600 - 44 - 8");
  h.dispose();
  const el2 = node("div", { w: 300, h: 200 }); el2.hidden = true; el2.style.width = "2000px"; el2.style.height = "900px";
  const h2 = registerFloatingWindow(el2, { id: "t-shrink-x", resize: { grip: null, min: { w: 100, h: 80 }, axis: "x" } });
  h2.open(); eq(el2.style.width, "784px"); eq(el2.style.height, "900px", "axis x：高不归库管");
  h2.dispose();
}));

test("[float-window] 显隐用类名（画画仓 = hidden 类）：开关只动类，不碰 hidden 属性", () => withEnv({}, () => {
  configureFloatWindows({ hiddenClass: "hidden" });
  try {
    const el = node("div", { w: 100, h: 100 }); el.classList.add("hidden");
    const h = registerFloatingWindow(el, { id: "t-class" });
    eq(h.isOpen(), false); h.open(); eq(el.classList.contains("hidden"), false); eq(el.hidden, false); eq(h.isOpen(), true);
    h.close(); eq(el.classList.contains("hidden"), true); eq(el.hidden, false, "属性一直没碰");
    h.dispose();
  } finally { configureFloatWindows({ hiddenClass: null }); }
}));

test("[float-window] z 序：开 = 置顶；raise 换到最上；内联 z-index = 底数 + 栈位", () => withEnv({}, () => {
  const a = node("div", { w: 100, h: 100 }), b = node("div", { w: 100, h: 100 }); a.hidden = b.hidden = true;
  const ha = registerFloatingWindow(a, { id: "t-za" }), hb = registerFloatingWindow(b, { id: "t-zb" });
  ha.open(); hb.open();
  let s = floatingWindowStack(); eq(s.slice(-2).join(","), "t-za,t-zb");
  raiseFloatingWindow(a); s = floatingWindowStack(); eq(s.at(-1), "t-za");
  assert(Number(a.style.zIndex) > Number(b.style.zIndex), "置顶的 z 大");
  ha.dispose(); hb.dispose();
  assert(!floatingWindowStack().includes("t-za") && !floatingWindowStack().includes("t-zb"), "拆了就出栈");
}));

test("[float-window] 临时藏窗：说了留的留下、没说的藏、从不参与的不动；复原只放回被藏的", () => withEnv({}, () => {
  const keep = node("div", { w: 10, h: 10 }), go = node("div", { w: 10, h: 10 }), never = node("div", { w: 10, h: 10 });
  const hk = registerFloatingWindow(keep, { id: "t-keep", transient: { keepDuring: ["crop"] } });
  const hg = registerFloatingWindow(go, { id: "t-go", transient: { keepDuring: [] } });
  const hn = registerFloatingWindow(never, { id: "t-never" });
  hk.open(); hg.open(); hn.open();
  suppressFloatingForTransient("crop");
  eq(keep.hidden, false); eq(go.hidden, true); eq(never.hidden, false);
  restoreFloatingAfterTransient();
  eq(go.hidden, false);
  hk.dispose(); hg.dispose(); hn.dispose();
}));

test("[float-window] 壳 · 左上圆钮：动不到 4 px = 点 = 收起 / 恢复（宽高留着、回声给宿主）；动过 = 挪窗、不收", () => withEnv({}, () => {
  eq(SHELL_KNOB_DRAG_PX, 4); eq(isKnobDrag(3, 0), false); eq(isKnobDrag(4, 0), true); eq(isKnobDrag(3, 3), true);
  const el = node("div", { w: 300, h: 200 }); el.hidden = true; el.style.width = "320px"; el.style.height = "240px";
  const col = [], moves = [];
  const h = registerFloatingWindow(el, { id: "t-knob", onMove: (p) => moves.push(p), resize: { grip: null, min: { w: 100, h: 80 } },
    shell: { knob: { iconHtml: "<svg></svg>", label: "小窗", hint: "点一下收起，按住拖" }, collapsible: { onCollapse: (c) => col.push(c) } } });
  h.open(); h.restore({ left: 100, top: 100 });
  const knob = el.find("wbe-float-knob");
  assert(knob && el.classList.contains("wbe-float-shell"), "有壳、有圆钮");
  eq(knob.title, "点一下收起，按住拖"); eq(knob.getAttribute("aria-label"), "小窗");
  knob.fire("pointerdown", { clientX: 10, clientY: 10 }); knob.fire("pointermove", { clientX: 13, clientY: 10 }); knob.fire("pointerup", { clientX: 13, clientY: 10 });
  eq(h.collapsed(), true, "3 px = 点 = 收起"); assert(el.classList.contains("wbe-float-collapsed")); eq(el.style.left, "100px", "点不挪窗"); eq(moves.length, 0);
  eq(el.offsetWidth, 44, "收成 44 px");
  knob.fire("pointerdown", { clientX: 10, clientY: 10 }); knob.fire("pointerup", { clientX: 10, clientY: 10 });
  eq(h.collapsed(), false, "再点 = 恢复"); eq(el.style.width, "320px", "原来的宽高留着"); eq(el.style.height, "240px");
  knob.fire("pointerdown", { clientX: 10, clientY: 10 }); knob.fire("pointermove", { clientX: 40, clientY: 30 }); knob.fire("pointerup", { clientX: 40, clientY: 30 });
  eq(h.collapsed(), false, "拖过 = 不收"); eq(el.style.left, "130px"); eq(el.style.top, "120px"); assert(moves.length > 0 && moves.at(-1).left === 130, "落点回声给宿主");
  knob.fire("pointerdown", { clientX: 0, clientY: 0 }); knob.fire("pointermove", { clientX: -500, clientY: -500 }); knob.fire("pointerup");
  eq(el.style.left, "0px", "拖也钳进视口"); eq(el.style.top, "44px");
  knob.fire("pointerdown"); knob.fire("pointercancel");
  eq(h.collapsed(), false, "取消不算点");
  h.setCollapsed(true); eq(col.join(","), "true,false,true", "收起 / 恢复都回声");
  h.dispose();
}));

test("[float-window] 壳 · 一开始就收着；没给 collapsible 的圆钮点了不收", () => withEnv({}, () => {
  const el = node("div", { w: 300, h: 200 });
  const h = registerFloatingWindow(el, { id: "t-pre", shell: { knob: { iconHtml: "", label: "x" }, collapsible: { collapsed: true } } });
  eq(h.collapsed(), true); assert(el.classList.contains("wbe-float-collapsed"));
  h.dispose();
  const el2 = node("div", { w: 300, h: 200 });
  const h2 = registerFloatingWindow(el2, { id: "t-nocol", shell: { knob: { iconHtml: "", label: "x" } } });
  const k = el2.find("wbe-float-knob"); k.fire("pointerdown"); k.fire("pointerup");
  eq(h2.collapsed(), false);
  h2.dispose();
}));

test("[float-window] 壳 · 斜纹角：库建它、拖它改大小（钳最小值）、回声", () => withEnv({}, () => {
  const el = node("div", { w: 300, h: 200 }); el.hidden = true;
  const sizes = [];
  const h = registerFloatingWindow(el, { id: "t-grip", resize: { grip: null, min: { w: 120, h: 90 }, onResize: (s) => sizes.push(s) }, shell: { grip: true } });
  h.open(); h.restore({ left: 0, top: 50 });
  const grip = el.find("wbe-float-grip");
  assert(grip && grip.classList.contains("wbe-float-part"), "库建了斜纹角，它跟着淡");
  grip.fire("pointerdown", { clientX: 300, clientY: 250 }); grip.fire("pointermove", { clientX: 350, clientY: 270 }); grip.fire("pointerup");
  eq(el.style.width, "350px"); eq(el.style.height, "220px"); eq(sizes.at(-1).w, 350);
  grip.fire("pointerdown", { clientX: 0, clientY: 0 }); grip.fire("pointermove", { clientX: -9999, clientY: -9999 }); grip.fire("pointerup");
  eq(el.style.width, "120px", "不小于最小值"); eq(el.style.height, "90px");
  h.dispose();
  const el2 = node("div", { w: 300, h: 200 });
  const h2 = registerFloatingWindow(el2, { id: "t-nogrip", shell: { grip: true } });
  eq(el2.find("wbe-float-grip"), null, "没给 resize 就不建角");
  h2.dispose();
}));

test("[float-window] 壳 · 闲置淡出：2.5 秒不动 → idle；一动就醒；能悬停的设备上离窗全隐、进窗即现；拖着时不淡", () => withEnv({ fakeTimers: true, hover: true }, ({ fire, timers }) => {
  eq(SHELL_IDLE_MS, 2500);
  const el = node("div", { w: 300, h: 200 }); el.hidden = true;
  const h = registerFloatingWindow(el, { id: "t-fade", shell: { knob: { iconHtml: "", label: "x" }, fade: true } });
  h.open();
  eq(fire().join(","), "2500"); assert(el.classList.contains("wbe-float-idle"), "到点淡");
  el.fire("pointermove"); assert(!el.classList.contains("wbe-float-idle"), "一动就醒");
  el.fire("pointerleave"); assert(el.classList.contains("wbe-float-away"), "离窗全隐");
  el.fire("pointerenter"); assert(!el.classList.contains("wbe-float-away"), "进窗即现");
  const knob = el.find("wbe-float-knob");
  knob.fire("pointerdown", { clientX: 0, clientY: 0 });
  el.fire("pointerleave"); assert(!el.classList.contains("wbe-float-away"), "拖着出了窗也不隐");
  fire(); assert(!el.classList.contains("wbe-float-idle"), "拖着到点也不淡");
  knob.fire("pointerup", { clientX: 0, clientY: 0 });
  h.dispose();
  eq(timers.size, 0, "拆了不留计时器");
}));

test("[float-window] 壳 · 不开 fade = 没有计时器、不加淡出类", () => withEnv({ fakeTimers: true, hover: true }, ({ timers }) => {
  const el = node("div", { w: 300, h: 200 }); el.hidden = true;
  const h = registerFloatingWindow(el, { id: "t-nofade", shell: { knob: { iconHtml: "", label: "x" } } });
  h.open(); eq(timers.size, 0);
  el.fire("pointerleave"); assert(!el.classList.contains("wbe-float-away"));
  h.dispose();
}));

test("[float-window] dispose 把挂过的监听全摘干净（窗、圆钮、斜纹角）", () => withEnv({ hover: true }, () => {
  const el = node("div", { w: 300, h: 200 });
  const h = registerFloatingWindow(el, { id: "t-dispose", resize: { grip: null, min: { w: 10, h: 10 } }, shell: { knob: { iconHtml: "", label: "x" }, collapsible: {}, grip: true, fade: true } });
  const knob = el.find("wbe-float-knob"), grip = el.find("wbe-float-grip");
  assert(el.listenerCount() > 0 && knob.listenerCount() > 0 && grip.listenerCount() > 0);
  h.dispose();
  eq(el.listenerCount(), 0, "窗"); eq(knob.listenerCount(), 0, "圆钮"); eq(grip.listenerCount(), 0, "斜纹角");
}));
