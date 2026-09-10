# 20260909 internal-workbench-elements — 本库规则（@internal/workbench-elements）

家族总规则见 `../CLAUDE.md`。created 2026-09-09 by Claude Fable 5.1（CatsUp 总账 A5：user 2026-09-06「也是近期要做的」「第二个用户第三个用户才长抽象，所以你来更适合」；A5 原文预名 `20260906 …`，按家规「创建日期 = 首次提交日」落 20260909）。

- **本库 = 家族 UI 原子**：`popup-menu` / `anchored-popup` / `notice` / `icon` 四件，**WeebPaint `src/ui` 的 WET 拷贝、不改语义**，签名以 WeebPaint `api/src/ui/*.d.ts` + `api/src/anchored-popup.d.ts` 为准。**不叫 `ui`**（scope bleeding 教训）。
- **宿主知识全走注入**：顶栏下缘 / 浮窗顶地板 = `configureFloors({ toolbarBottom, floatingTop })`（不配 = 0 / safeAreaTop）；sprite 归宿主，包只拼 `<use href="#id">`；CSS 在 `src/workbench-elements.css`（门牌 `./workbench-elements.css`），token（`--ink --line --z-*` 等）由宿主 `:root` 提供。
- **消费方**：CatsUp 删 `src/app/ui/` 三件替身换 import；WeebPaint 由其 session 收货（跑 `tools/probes/{context-toolbar,verb-toolbar,pick-once}.mjs` 回归）；`@internal/gallery` 的 UI 层依赖本包。
- **只出货不送货 / 版本纪律 / API ritual**：同 `../20260813 internal-store/CLAUDE.md`（tgz + pull-package.sh；开发期 0.0.0；exports 过目才写版本）。
- 测试 `npm test`（node runner + 最小 DOM 假件，覆盖「anchored-popup 钳视口 + 顶栏下缘 getter」）；`journal/` 人类区，AI 永不写。
