# @internal/workbench-elements

> created 2026-09-09 by Claude Fable 5.1 · as-of 0.0.0 · 源 = WeebPaint v0.14.9 `src/ui/{popup-menu,notice,icon}.ts` + `src/anchored-popup.ts`（WET，不改语义）

```ts
import { configureFloors, togglePopupMenu, showNotice, iconHtml } from "@internal/workbench-elements";
configureFloors({ toolbarBottom: () => topBar.getBoundingClientRect().bottom });   // 宿主布局知识，一次注入；无顶栏的宿主不用配
```
- CSS：宿主把 `@internal/workbench-elements/workbench-elements.css` 内联进自己的样式（class 名与 WeebPaint 同）。需要宿主 `:root` 提供 `--bg --bg-soft --ink --ink-soft --line --shadow --accent --danger --z-menu --z-popover --z-modal --z-notice --z-toast`。
- 图标：`iconHtml(name)` 只拼 `<svg><use href="#name">`，sprite 由宿主内联（家族图标库 `extract-icons.py`）。
- 收货：在消费方仓根 `bash "../20260909 internal-workbench-elements/scripts/pull-package.sh" <ver>`。
