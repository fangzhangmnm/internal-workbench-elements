// 宿主「地板」注入（A5 包化，2026-09-09，Claude Fable 5.1）。
// WeebPaint 里 anchored-popup 直接 import context-toolbar 的下缘、notice 直接 import floating-window 的顶地板——
// 那是宿主布局知识，包不能有。宿主在 mount 时 configureFloors({...})；不配 = 0 / safeAreaTop（无顶栏的宿主，如 CatsUp）。

// env(safe-area-inset-top) 在 JS 拿不到解析后的字面值 → 一次性探针量 padding-top（旋转 / 机型变了也准）。（原 anchored-popup.ts）
export function safeAreaTop(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;height:0;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none;";
  document.body.appendChild(probe);
  const v = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return v;
}

export interface HostFloors {
  /** 顶部工具条群的下缘（px，视口坐标）——popup belowToolbars / notice docked-top 用。 */
  toolbarBottom: () => number;
  /** 浮窗/停靠通知的顶地板（px）——默认 = 顶栏下缘。 */
  floatingTop: () => number;
}
const _f: HostFloors = { toolbarBottom: () => 0, floatingTop: () => safeAreaTop() };
export const floors: Readonly<HostFloors> = { toolbarBottom: () => _f.toolbarBottom(), floatingTop: () => _f.floatingTop() };
export function configureFloors(f: Partial<HostFloors>): void {
  if (f.toolbarBottom) _f.toolbarBottom = f.toolbarBottom;
  if (f.floatingTop) _f.floatingTop = f.floatingTop;
  else if (f.toolbarBottom) _f.floatingTop = () => Math.max(safeAreaTop(), f.toolbarBottom!());
}
