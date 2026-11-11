// float-window.ts —— 浮窗的壳：「一扇常驻浮窗的整个生命周期」只此一处（z 序 / 视口钳制 / 拖动 / 缩放 / 恢复位置 / 转屏重钳）+ 可选的壳零件。
// 进库 2026-11-11 by Claude Opus 5.5（CatsUp 施工单十七；家族周账 F-253 第一步：「这套壳现在有三份，该有个共同的家」，user 11-11「好，可以，我批准你升版本，然后把这个给抽象出来」）。
// 来历：WeebPaint src/ui/floating-window.ts（created 2026-09-02 by Claude Fable 5.1，WeebPaint UI 纪元 C2）→ CatsUp src/app/ui/floating-window.ts（2026-10-30 搬入）→ 这里。
//   搬，不重写：接口的名字和样子照原样；两家的差别变成参数——
//   ① 顶边地板量的是谁：configureFloatingWindows({ hudBottom })（缺省 = host-floors 的 floatingTop）；② 显隐用 hidden 属性（缺省）还是一个类名（hiddenClass，画画仓 = "hidden"）；
//   ③ 临时藏窗（画画仓的 transient 抑制）照搬成可选（spec.transient + suppress / restore 两个函数）；画画仓的 resize.axis / getSize / apply、onViewport 也照搬成可选。
//   新加：④ 底边地板 spec.bottomFloor（底部抽屉、软键盘占掉的高度：拖 / 恢复 / 改大小 / 视口钳制都让出来，右下角不被盖住；不给 = 0，和以前一样）；
//   ⑤ 能改大小的窗比能用的地方还大（浏览器窗口缩小了）= 先缩到放得下再挪（画画仓本来就这样，三维那份以前没有）；
//   ⑥ 四样可选的壳零件 spec.shell（全不开 = 和以前一模一样；名字 = FloatingWindowShell）：样子和数照 @internal/reference-window 0.4.3 起的 reference-window.ts 抄（.move .knob / .bubble / .grip / .idle .away）：
//      左上圆钮（28 px 的钮、可点区 36 px、触屏 44 px、一圈淡边；点一下 = 收起 / 恢复，按住动过 4 px = 挪窗）、收成 44 px 的小图标（同一个图标、同一个位置，
//      拖 = 挪、点 = 恢复，宽高留着）、右下 19 px 的斜纹角（触屏能拖）、闲置淡出（2.5 秒淡到 0.35；能悬停的设备上指针离窗全隐、进窗即现；拖窗 / 改大小时不淡）。
// 库自己不存东西、不认识任何 app：位置（onMove）、大小（resize.onResize）、收没收起（shell.collapsible.onCollapse）都用回调交给宿主，宿主决定记在哪。
// 顶边地板（WeebPaint 2026-09-02 查证的定案）：iPadOS 窗口模式 env(safe-area-inset-*) 会失效、顶边有不上报的触摸死区、没有 API 报死区高度 →
// 不手填常数，运行时量：地板 = max(安全区 + 死区底线, HUD 顶排下缘 + 间距)。
// 视口：用 innerHeight 不用 visualViewport（iOS 软键盘只改 visualViewport，跟着它钳面板会抖，WeebPaint 0828）；只有给了 bottomFloor 的窗跟 visualViewport 重钳。
// 不管什么：内容、开关的业务语义（谁来决定开）、位置记在哪。
import { attachPanelDrag, attachPanelResize, clampPanelPos, clampSize, type GizmoHandle, type PanelPos } from "./panel-gizmo.ts";
import { floors, safeAreaTop } from "./host-floors.ts";
import { iconHtml } from "./icon.ts";

export type { PanelPos } from "./panel-gizmo.ts";

export const TOP_DEAD_ZONE_MIN = 24;   // 顶边触摸死区硬底线（iOS 18+ 横屏死区未被 env() 上报，社区建议 ≥20px）
export const FLOOR_GAP = 4;            // HUD 顶排下缘到拖把的间距
export const EDGE_MARGIN = 8;          // 尺寸钳制时离视口右 / 下边距
/** 壳零件：左上圆钮按下之后动过这么多 CSS 像素才算拖（照参考窗 0.4.3）。 */
export const SHELL_KNOB_DRAG_PX = 4;
/** 壳零件：窗上不动这么多毫秒 = 零件淡到 0.35（照参考窗 IDLE_DIM_MS）。 */
export const SHELL_IDLE_MS = 2500;

/** 顶地板（纯函数）：max(安全区 + 24（iOS 顶边不上报的触摸死区）, HUD 顶排下缘 + 4)。hudBottom = null = 顶排看不见。 */
export function computeTopFloor(safeTop: number, hudBottom: number | null): number {
  const base = safeTop + TOP_DEAD_ZONE_MIN;
  return hudBottom != null ? Math.max(base, hudBottom + FLOOR_GAP) : base;
}

/** 宿主的布局知识（app 级，开机配一次；不调 configureFloatingWindows = 下面每一项的缺省）。 */
export interface FloatingWindowsConfig {
  /** HUD 顶排的下缘（px，视口坐标），浮窗的拖把不进到它上面；返回 null = 顶排现在看不见。每次钳制现量。不给 = 用 host-floors 的 floors.floatingTop()（没配过 floors = 安全区）。 */
  hudBottom?: () => number | null;
  /** 显隐用的类名（画画仓 = "hidden"：有这个类 = 藏着）。不给 / 给 null = 用元素的 hidden 属性。 */
  hiddenClass?: string | null;
  /** z 序底数的兜底：先读宿主 :root 的 CSS 变量 --z-window，读不到才用它。不给 = 200。第 i 扇（从下往上）的 z-index = 底数 + i。 */
  zBase?: number;
}
const _cfg: { hudBottom: (() => number | null) | null; hiddenClass: string | null; zBase: number } = { hudBottom: null, hiddenClass: null, zBase: 200 };
/** 配宿主的布局知识（只改给了的项；可以再调，后调的盖先调的）。不调 = FloatingWindowsConfig 里写的缺省。 */
export function configureFloatingWindows(c: FloatingWindowsConfig): void {
  if (c.hudBottom !== undefined) _cfg.hudBottom = c.hudBottom;
  if (c.hiddenClass !== undefined) _cfg.hiddenClass = c.hiddenClass;
  if (c.zBase !== undefined) { _cfg.zBase = c.zBase; _base = 0; }
}
/** 现在的顶地板（px）：浮窗拖把的上沿不高过它。= computeTopFloor(安全区, hudBottom())，每次现量（旋转 / 顶排显隐 / 安全区变了都准）。 */
export function floatingTopFloor(): number {
  let safe = 0;
  try { safe = safeAreaTop(); } catch { safe = 0; }
  let hud: number | null;
  try { hud = _cfg.hudBottom ? _cfg.hudBottom() : floors.floatingTop(); } catch { hud = null; }
  return computeTopFloor(safe, hud);
}

/** 四样可选的壳零件（一样都不给 = 没有壳，和 0.1.x 宿主自己的浮窗一模一样）。样子在 workbench-elements.css 的 .wbe-float-*。 */
export interface FloatingWindowShell {
  /** 左上圆钮。点一下 = 收起 / 恢复（开了 collapsible 才有）；按住动过 4 px = 挪窗（落点照样给 spec.onMove）。不给 = 没有圆钮。 */
  knob?: {
    /** 图标：sprite 里 symbol 的 id（和 popup-menu 的 icon 一样；库用 iconHtml 画，sprite 归宿主）。 */
    icon: string;
    /** 读屏名（aria-label）。 */
    label: string;
    /** 悬停提示（title）。不给 = 用 label。 */
    hint?: string;
  };
  /** 能收成小图标：44 px 圆钮、同一个图标、同一个位置；拖 = 挪，点 = 恢复；原来的宽高留着。必须同时给 knob（收起之后它是唯一的回来路），不给 knob = 注册时抛。不给 collapsible = 收不起来。 */
  collapsible?: {
    /** 注册时就收着。不给 = 展开。 */
    collapsed?: boolean;
    /** 收起 / 恢复之后告诉宿主（宿主决定记不记、记在哪）。 */
    onCollapse?: (collapsed: boolean) => void;
    /** 收着时那颗小图标的读屏名。不给 = knob.label。 */
    restoreLabel?: string;
    /** 收着时那颗小图标的悬停提示。不给 = knob.hint，再没有 = 收着时的读屏名。 */
    restoreHint?: string;
  };
  /** 右下斜纹角（19 px，触屏能拖）：库自己建这个改大小的把手。必须同时给 spec.resize（要 min 那些）且 resize.grip 给 null；没给 resize、或者 resize.grip 也给了元素 = 注册时抛（两个把手不悄悄挑一个）。不给 = 没有斜纹角（把手照旧看 resize.grip）。 */
  corner?: boolean;
  /** 闲置淡出：窗上 2.5 秒不动 → 零件淡到 0.35；能悬停的设备上指针离窗 → 全隐、进窗即现；拖窗 / 改大小时不淡。宿主自己的小钮加类名 wbe-float-part 也跟着淡（收起时也跟着藏）。不给 = 不淡。 */
  fade?: boolean;
}

/** 一扇浮窗的说明（registerFloatingWindow 的第二个参数）。 */
export interface FloatingWindowSpec {
  /** 这扇窗的名字（floatingWindowStack 里报它；同一个元素再注册 = 先拆旧的）。 */
  id: string;
  /** 拖把（标题栏）：按住它拖整扇窗。不给 / null = 不靠标题栏拖（壳的圆钮、或宿主自己拖）。 */
  head?: HTMLElement | null;
  /** 拖把上哪些目标按下去不起拖（关闭钮这类）。不给 = 拖把上哪里都起拖。 */
  ignoreDragOn?: (target: Element) => boolean;
  /** 每次挪窗的落点（已钳过，库已写好 left / top）——宿主只管记。不给 = 不报。 */
  onMove?: (pos: PanelPos) => void;
  /** 能改大小。不给 = 库不改大小（也不做「太大先缩」）。 */
  resize?: {
    /** 改大小的把手元素；null = 没有宿主给的把手（用壳的 corner，或者只要「太大先缩」）。 */
    grip: HTMLElement | null;
    /** 最小宽高（px）：拖不小于它，缩也不缩过它。 */
    min: { w: number; h: number };
    /** "x" = 只改宽（画画仓的图层窗，高归宿主）。不给 = "both"。 */
    axis?: "both" | "x";
    /** 起拖时量现在的尺寸。不给 = 窗的 offsetWidth / offsetHeight。 */
    getSize?: () => { w: number; h: number };
    /** 自己落地尺寸。给了它库就不写 style.width / height（也不做「太大先缩」）。不给 = 库写行内宽高。 */
    apply?: (size: { w: number; h: number }) => void;
    /** 改完大小的回声（宿主记）。不给 = 不报。 */
    onResize?: (size: { w: number; h: number }) => void;
  };
  /** 宿主进「临时藏窗」的模式时这扇窗的去留（见 suppressFloatingForTransient）。keepDuring = 这些模式里留着；模式的名字是宿主自己起的字符串，库只拿来比相等。不给 = 从不被临时藏。 */
  transient?: { keepDuring: string[] };
  /** open / close 的回声（钮的按下态这类）。临时藏 / 复原不叫它。不给 = 不报。 */
  onOpenChange?: (open: boolean) => void;
  /** 视口变了（旋转 / 拉窗 / 宿主调 clampAllFloatingWindows）、库重钳完之后叫，带现在的顶地板——给自己再钳一遍里面东西的组件用。不给 = 不叫。 */
  onViewport?: (floor: number) => void;
  /** 藏着时量不到尺寸，恢复位置钳的时候用它当窗的大小。不给 = 280 × 240。 */
  fallbackSize?: { w: number; h: number };
  /** 屏底被占掉的高度（px：底部抽屉、软键盘），每次钳制现量：拖 / 恢复 / 改大小 / 视口钳制都让出来，右下角不被盖住；给了它的窗也跟 visualViewport 重钳。不给 = 0。 */
  bottomFloor?: () => number;
  /** 壳零件。不给 = 没有壳。 */
  shell?: FloatingWindowShell;
}

/** 注册之后拿到的手柄。 */
export interface FloatingWindowHandle {
  /** 这扇窗的元素。 */
  readonly el: HTMLElement;
  /** spec.id。 */
  readonly id: string;
  /** 开：显示、置顶、钳进视口，叫 onOpenChange(true)。 */
  open(): void;
  /** 关：藏起来，叫 onOpenChange(false)。 */
  close(): void;
  /** 开着就关、关着就开（force 给了 = 照它）；返回现在开没开。 */
  toggle(force?: boolean): boolean;
  /** 现在开着没有（临时藏着 = 没开）。 */
  isOpen(): boolean;
  /** 置顶。 */
  raise(): void;
  /** 钳进视口（拖把不进顶地板、不出屏、不被屏底盖住；能改大小的太大先缩）。藏着时不做。 */
  clamp(): void;
  /** 放到这个位置（钳过；给了宽高且能改大小 = 也设宽高）；null = 回 CSS 默认位（清掉行内的位置和宽高）。 */
  restore(pos: (PanelPos & { width?: number; height?: number }) | null): void;
  /** 壳：现在收没收着（没开 collapsible = 永远 false）。 */
  collapsed(): boolean;
  /** 壳：收起 / 恢复（没开 collapsible = 不做；变了才叫 onCollapse）。 */
  setCollapsed(on: boolean): void;
  /** 拆：摘掉库挂的所有监听和计时器、出 z 栈。元素本身留给宿主。 */
  dispose(): void;
}

interface Entry { el: HTMLElement; spec: FloatingWindowSpec; handle: FloatingWindowHandle; drag: GizmoHandle | null; resize: GizmoHandle | null; suppressed: boolean; onRaise: (e: Event) => void; offs: (() => void)[] }

const _stack: Entry[] = [];   // z 序：末位最高
let _base = 0;
function zBase(): number {
  if (!_base) {
    let v = NaN;
    try { v = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--z-window"), 10); } catch { /* 测试环境 */ }
    _base = Number.isFinite(v) && v > 0 ? v : _cfg.zBase;
  }
  return _base;
}
function normalizeZ(): void { const b = zBase(); _stack.forEach((en, i) => { en.el.style.zIndex = String(b + i); }); }
function raise(en: Entry): void { const i = _stack.indexOf(en); if (i >= 0) _stack.splice(i, 1); _stack.push(en); normalizeZ(); }
const isHidden = (el: HTMLElement): boolean => (_cfg.hiddenClass ? el.classList.contains(_cfg.hiddenClass) : el.hidden);
const setHidden = (el: HTMLElement, on: boolean): void => { if (_cfg.hiddenClass) el.classList.toggle(_cfg.hiddenClass, on); else el.hidden = on; };
const vw = (): number => window.innerWidth, vh = (): number => window.innerHeight;
/** 这扇窗能用的视口高（减掉屏底被占掉的那一截）。 */
const vhOf = (en: Entry): number => vh() - Math.max(0, en.spec.bottomFloor?.() ?? 0);
function sizeOf(en: Entry, hint?: { width?: number; height?: number }): { w: number; h: number } {
  const fb = en.spec.fallbackSize ?? { w: 280, h: 240 };
  return { w: en.el.offsetWidth || hint?.width || fb.w, h: en.el.offsetHeight || hint?.height || fb.h };
}
function writePos(en: Entry, pos: PanelPos): void { en.el.style.left = `${pos.left}px`; en.el.style.right = "auto"; en.el.style.top = `${pos.top}px`; }
function clampEntry(en: Entry): void {
  if (isHidden(en.el) || !(vw() > 0) || !(vh() > 0)) return;
  // 能改大小的窗：比能用的地方还大 = 先缩到放得下（不小于最小值），再挪
  const rs = en.spec.resize;
  if (rs && !rs.apply) {
    const maxW = Math.max(rs.min.w, vw() - 2 * EDGE_MARGIN), maxH = Math.max(rs.min.h, vhOf(en) - floatingTopFloor() - EDGE_MARGIN);
    if (en.el.offsetWidth > maxW + 0.5) en.el.style.width = `${maxW}px`;
    if (rs.axis !== "x" && en.el.offsetHeight > maxH + 0.5) en.el.style.height = `${maxH}px`;
  }
  const { w, h } = sizeOf(en), r = en.el.getBoundingClientRect(), cur = { left: r.left, top: r.top };
  const next = clampPanelPos(cur, { w, h }, { w: vw(), h: vhOf(en) }, floatingTopFloor());
  if (Math.abs(next.left - cur.left) > 0.5 || Math.abs(next.top - cur.top) > 0.5) writePos(en, next);
}

// 视口变（旋转 / 分屏 / 桌面拉窗）→ 开着的窗全部重钳 + 通知自钳组件，合帧。
let vpRaf = 0, vpListening = false;
function onViewport(): void {
  if (vpRaf) return;
  vpRaf = requestAnimationFrame(() => { vpRaf = 0; clampAllFloatingWindows(); });
}
function ensureViewportListener(): void {
  if (vpListening || typeof window === "undefined" || !window.addEventListener) return;
  vpListening = true;
  window.addEventListener("resize", onViewport);
  window.addEventListener("orientationchange", onViewport);
  window.visualViewport?.addEventListener("resize", () => { if (_stack.some((en) => en.spec.bottomFloor)) onViewport(); });   // 软键盘：只有给了底地板的窗跟
}
/** 所有开着的窗重钳一遍、再叫各自的 onViewport（和视口事件同一条路）。宿主布局变了（抽屉开合这类）时调。 */
export function clampAllFloatingWindows(): void {
  const floor = floatingTopFloor();
  for (const en of _stack) { clampEntry(en); en.spec.onViewport?.(floor); }
}

/** 左上圆钮按下之后的位移算不算拖（纯函数，测试用）。 */
export function isKnobDrag(dx: number, dy: number): boolean { return Math.hypot(dx, dy) >= SHELL_KNOB_DRAG_PX; }

/** 把一个宿主建好的元素登记成浮窗（先藏着；第一次 open 才置顶）。同一个元素再登记 = 先拆旧的。shell 的组合不对（见 FloatingWindowShell）= 抛。 */
export function registerFloatingWindow(el: HTMLElement, spec: FloatingWindowSpec): FloatingWindowHandle {
  _stack.find((e) => e.el === el)?.handle.dispose();
  const en: Entry = { el, spec, handle: null as unknown as FloatingWindowHandle, drag: null, resize: null, suppressed: false, onRaise: () => raise(en), offs: [] };
  const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions): void => { t.addEventListener(type, fn as EventListener, opts); en.offs.push(() => t.removeEventListener(type, fn as EventListener, opts)); };
  // —— 壳零件 ——
  const shell = spec.shell;
  if (shell?.corner && !spec.resize) throw new Error(`[float-window] ${spec.id}: shell.corner needs spec.resize (min size)`);
  if (shell?.corner && spec.resize?.grip) throw new Error(`[float-window] ${spec.id}: shell.corner draws the resize handle itself; give resize.grip = null, not both`);
  if (shell?.collapsible && !shell.knob) throw new Error(`[float-window] ${spec.id}: shell.collapsible needs shell.knob (the only way back from collapsed)`);
  let knobEl: HTMLButtonElement | null = null;
  /** 圆钮的读屏名 / 提示跟着收没收起换。 */
  const knobText = (): void => {
    if (!knobEl || !shell?.knob) return;
    const k = shell.knob, c = shell.collapsible;
    const label = collapsedNow ? (c?.restoreLabel ?? k.label) : k.label;
    const hint = collapsedNow ? (c?.restoreHint ?? k.hint ?? label) : (k.hint ?? k.label);
    knobEl.title = hint; knobEl.setAttribute("aria-label", label);
  };
  let collapsedNow = false, busy = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const poke = (): void => { if (!shell?.fade) return; el.classList.remove("wbe-float-idle"); if (idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!busy) el.classList.add("wbe-float-idle"); }, SHELL_IDLE_MS); };
  const setCollapsed = (v: boolean): void => {
    if (!shell?.collapsible || v === collapsedNow) return;
    collapsedNow = v; el.classList.toggle("wbe-float-collapsed", v);
    knobText();
    clampEntry(en);
    shell.collapsible.onCollapse?.(v);
  };
  let gripEl: HTMLElement | null = spec.resize?.grip ?? null;
  if (shell) {
    el.classList.add("wbe-float-shell");
    if (shell.corner && spec.resize) { gripEl = document.createElement("div"); gripEl.className = "wbe-float-grip wbe-float-part"; gripEl.setAttribute("aria-hidden", "true"); el.appendChild(gripEl); }
    if (shell.knob) {
      const knob = document.createElement("button"); knob.type = "button"; knob.className = "wbe-float-knob"; knobEl = knob;
      const dot = document.createElement("span"); dot.className = "wbe-float-dot"; dot.innerHTML = iconHtml(shell.knob.icon); knob.appendChild(dot);
      el.appendChild(knob);
      let d: { id: number; sx: number; sy: number; ol: number; ot: number; moved: boolean } | null = null;
      on(knob, "pointerdown", (e) => {
        const r = el.getBoundingClientRect();
        d = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ol: r.left, ot: r.top, moved: false }; busy = true;
        try { knob.setPointerCapture(e.pointerId); } catch { /* 测试环境 */ }
        e.preventDefault();
      });
      on(knob, "pointermove", (e) => {
        if (!d || e.pointerId !== d.id) return;
        const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
        if (!d.moved && !isKnobDrag(dx, dy)) return;
        d.moved = true;
        handle.restore({ left: d.ol + dx, top: d.ot + dy });
        const r = el.getBoundingClientRect(); spec.onMove?.({ left: r.left, top: r.top });
      });
      const up = (e: PointerEvent): void => {
        if (!d || e.pointerId !== d.id) return;
        try { knob.releasePointerCapture(e.pointerId); } catch { /* 测试环境 */ }
        const moved = d.moved; d = null; busy = false; poke();
        if (!moved && e.type === "pointerup") setCollapsed(!collapsedNow);
      };
      on(knob, "pointerup", up); on(knob, "pointercancel", up);
    }
    if (shell.collapsible?.collapsed) { collapsedNow = true; el.classList.add("wbe-float-collapsed"); }
    knobText();
    if (shell.fade) {
      on(el, "pointerdown", poke, { capture: true }); on(el, "pointermove", poke, { capture: true, passive: true });
      if (typeof matchMedia === "function" && matchMedia("(hover: hover)").matches) {
        on(el, "pointerenter", () => el.classList.remove("wbe-float-away"));
        on(el, "pointerleave", () => { if (!busy) el.classList.add("wbe-float-away"); });
      }
      if (gripEl) { const g = gripEl; on(g, "pointerdown", () => { busy = true; }, { capture: true }); const ub = (): void => { busy = false; poke(); }; on(g, "pointerup", ub); on(g, "pointercancel", ub); }
    }
  }
  const handle: FloatingWindowHandle = {
    el, id: spec.id,
    isOpen: () => !isHidden(el),
    open() { setHidden(el, false); en.suppressed = false; raise(en); clampEntry(en); poke(); spec.onOpenChange?.(true); },   // 开窗的瞬间必须在视口里（不管坐标从哪条路来）
    close() { setHidden(el, true); en.suppressed = false; spec.onOpenChange?.(false); },
    toggle(force?: boolean) { const show = force ?? isHidden(el); if (show) handle.open(); else handle.close(); return show; },
    raise: () => raise(en),
    clamp: () => clampEntry(en),
    restore(pos) {
      if (!pos) { el.style.left = ""; el.style.right = ""; el.style.top = ""; el.style.width = ""; el.style.height = ""; return; }
      const rs = spec.resize;
      if (rs && !rs.apply) {
        if (pos.width) el.style.width = `${clampSize(pos.width, rs.min.w, Math.max(rs.min.w, vw() - 24))}px`;
        if (pos.height && rs.axis !== "x") el.style.height = `${clampSize(pos.height, rs.min.h, Math.max(rs.min.h, vhOf(en) - floatingTopFloor() - EDGE_MARGIN))}px`;
      }
      writePos(en, clampPanelPos({ left: pos.left, top: pos.top }, sizeOf(en, pos), { w: vw(), h: vhOf(en) }, floatingTopFloor()));
    },
    collapsed: () => collapsedNow,
    setCollapsed,
    dispose() {
      en.drag?.dispose(); en.resize?.dispose();
      el.removeEventListener("pointerdown", en.onRaise, true);
      for (const off of en.offs) off();
      if (idleTimer) clearTimeout(idleTimer);
      const i = _stack.indexOf(en); if (i >= 0) _stack.splice(i, 1);
      normalizeZ();
    },
  };
  en.handle = handle;
  _stack.unshift(en); normalizeZ();   // 进栈底；第一次真正置顶在 open
  el.addEventListener("pointerdown", en.onRaise, true);   // 点窗 = 置顶
  if (spec.head) en.drag = attachPanelDrag(el, spec.head, { ignore: spec.ignoreDragOn, topFloor: floatingTopFloor, onMove: (pos) => { writePos(en, pos); spec.onMove?.(pos); } });
  const rs = spec.resize;
  if (rs && gripEl) {
    en.resize = attachPanelResize(el, gripEl, {
      getSize: rs.getSize ?? (() => ({ w: el.offsetWidth, h: el.offsetHeight })), min: rs.min,
      max: () => { const r = el.getBoundingClientRect(); return { w: vw() - r.left - EDGE_MARGIN, h: rs.axis === "x" ? Infinity : vhOf(en) - r.top - EDGE_MARGIN }; },
      onResize: (s) => {
        if (rs.apply) rs.apply(s);
        else { el.style.width = `${s.w}px`; if (rs.axis !== "x") el.style.height = `${s.h}px`; }
        rs.onResize?.(s);
      },
    });
  }
  ensureViewportListener();
  return handle;
}

/** 按元素找句柄（库内用）。 */
export function floatingWindowOf(el: HTMLElement | null): FloatingWindowHandle | null { return el ? _stack.find((e) => e.el === el)?.handle ?? null : null; }
/** 按元素置顶（没注册过 / null = 不做）。 */
export function raiseFloatingWindow(el: HTMLElement | null): void { floatingWindowOf(el)?.raise(); }

// —— 临时藏窗（画画仓的 transient 抑制）：每扇窗自述去留，库记谁被藏了 ——
/** 宿主进一个「临时藏窗」的模式（画画仓的变形 / 裁切这类）：开着的、给了 spec.transient、keepDuring 里没有这个模式的窗先藏起来（不叫 onOpenChange）。连着调 = 先复原再按新模式藏。 */
export function suppressFloatingForTransient(mode: string): void {
  restoreFloatingAfterTransient();   // 防套用：先复原再藏
  for (const en of _stack) {
    const t = en.spec.transient;
    if (!t || t.keepDuring.includes(mode) || isHidden(en.el)) continue;
    setHidden(en.el, true); en.suppressed = true;
  }
}
/** 出那个模式：只把上一次 suppressFloatingForTransient 藏起来的窗放回来。 */
export function restoreFloatingAfterTransient(): void {
  for (const en of _stack) { if (!en.suppressed) continue; setHidden(en.el, false); en.suppressed = false; }
}

/** 诊断 / 探针：现在注册着的窗的 id，按 z 从下往上。 */
export function floatingWindowStack(): string[] { return _stack.map((e) => e.spec.id); }
