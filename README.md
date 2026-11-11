# @internal/workbench-elements

> created 2026-09-09 by Claude Fable 5.1 · as-of 0.2.0（2026-11-11 加浮窗的壳） · 源 = WeebPaint v0.14.9 `src/ui/{popup-menu,notice,icon}.ts` + `src/anchored-popup.ts`（WET，不改语义）

```ts
import { configureFloors, togglePopupMenu, showNotice, iconHtml } from "@internal/workbench-elements";
configureFloors({ toolbarBottom: () => topBar.getBoundingClientRect().bottom });   // 宿主布局知识，一次注入；无顶栏的宿主不用配
```
- CSS：宿主把 `@internal/workbench-elements/workbench-elements.css` 内联进自己的样式（class 名与 WeebPaint 同）。需要宿主 `:root` 提供 `--bg --bg-soft --ink --ink-soft --line --shadow --accent --danger --z-menu --z-popover --z-modal --z-notice --z-toast`。
- 图标：`iconHtml(name)` 只拼 `<svg><use href="#name">`，sprite 由宿主内联（家族图标库 `extract-icons.py`）。
- 收货：在消费方仓根 `bash "../20260909 internal-workbench-elements/scripts/pull-package.sh" <ver>`。

## 浮窗的壳 `float-window`（0.2.0 起）

> added 2026-11-11 by Claude Opus 5.5 · CatsUp 施工单十七 / 家族周账 F-253 第一步。来历：WeebPaint `src/ui/floating-window.ts` + `panel-gizmo.ts` → CatsUp 拷贝 → 这里（搬，不重写，接口名字照旧）。

一扇常驻浮窗的整个一生只在这一处：z 序（点窗 = 置顶）、钳进视口（拖把不进顶边死区、不出屏、不被屏底占掉的那截盖住）、标题栏拖动、右下角改大小、恢复位置、转屏 / 拉窗重钳、临时藏窗。库不存东西、不认识 app：位置 / 大小 / 收没收起都用回调交给宿主。

```ts
import { configureFloatingWindows, registerFloatingWindow } from "@internal/workbench-elements";
configureFloatingWindows({ hudBottom: () => hudRow.getBoundingClientRect().bottom });   // 一次；不配 = host-floors 的 floatingTop()
const win = registerFloatingWindow(el, {
  id: "layers", head: titleBar, onMove: (p) => remember(p),
  resize: { grip: null, min: { w: 200, h: 160 }, onResize: (s) => remember(s) },
  bottomFloor: () => drawerHeight(),                          // 可选：底部抽屉 / 软键盘占掉的高度
  shell: {                                                    // 可选：四样壳零件，全不开 = 没有壳
    knob: { icon: "layers", label: "图层", hint: "点一下收起，按住拖" },   // 左上圆钮（icon = sprite 的 symbol id）：点 = 收起 / 恢复，动过 4 px = 挪窗
    collapsible: { onCollapse: (c) => remember(c), restoreLabel: "打开图层" },   // 收成 44 px 的小图标（要 knob）
    corner: true,                                             // 库画右下 19 px 斜纹角当改大小的把手（要 resize，且 resize.grip = null）
    fade: true,                                               // 2.5 秒不动淡到 0.35；能悬停的设备上离窗全隐
  },
});
win.open(); win.restore({ left: 40, top: 80, width: 320 });
```

- 组合不对就抛、不悄悄挑一个：`corner` 没给 `resize` / `corner` 和 `resize.grip` 都给 / `collapsible` 没有 `knob`。
- 宿主两家的差别是参数：顶边地板量谁（`hudBottom`）；显隐用 `hidden` 属性还是类名（`hiddenClass`，画画仓 = `"hidden"`）；临时藏窗（`spec.transient` + `suppressFloatingForTransient / restoreFloatingAfterTransient`）；只改宽的窗（`resize.axis: "x"`）、自己落地尺寸的窗（`resize.getSize / apply`）。
- 壳零件的样子在 `workbench-elements.css` 的 `.wbe-float-*`（数照 `@internal/reference-window` 0.4.3 起）。窗本身的底色 / 边框 / 圆角 / 显隐归宿主；token `--bg --ink --line`，圆钮底色可另给 `--wbe-float-dot-bg`。宿主自己的小钮（关、菜单）加类名 `wbe-float-part` 就跟着淡；收起时窗里除了圆钮全藏。
- 视口用 `innerHeight` 不用 `visualViewport`（iOS 软键盘只改后者，跟着它钳会抖）；只有给了 `bottomFloor` 的窗跟 `visualViewport` 重钳。宿主布局变了（抽屉开合）可以调 `clampAllFloatingWindows()`。
