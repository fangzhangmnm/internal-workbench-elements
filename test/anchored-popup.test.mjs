import { test, eq, assert } from "./runner.mjs";
import { installMiniDom } from "./dom-mini.mjs";
const { el } = installMiniDom({ innerWidth: 800, innerHeight: 600, safeTop: 20 });
const { positionPopup, topToolbarBottom, configureFloors, safeAreaTop } = await import("../src/index.ts");

test("[floors] 不配 → toolbarBottom=0；safeAreaTop 走探针（假件给 20）", () => {
  eq(topToolbarBottom(), 0);
  eq(safeAreaTop(), 20);
});

test("[positionPopup] 锚在按钮下：top = anchor.bottom + offsetY；右对齐 right = 视口宽 - anchor.right", () => {
  const anchor = el({ getBoundingClientRect: () => ({ top: 100, left: 300, right: 340, bottom: 130, width: 40, height: 30 }) });
  const popup = el({ offsetWidth: 200, offsetHeight: 100 });
  positionPopup(popup, { anchor, align: "right" });
  eq(popup.style.position, "fixed");
  eq(popup.style.top, "134px", "130 + 默认 offsetY 4");
  eq(popup.style.right, "460px", "800 - 340");
  eq(popup.style.left, "auto");
});

test("[positionPopup] 钳视口：左对齐锚在最右边的按钮 → left 被夹到 viewport-w-edgeMargin；底部溢出 → top 夹到 viewport-h-8", () => {
  const anchor = el({ getBoundingClientRect: () => ({ top: 560, left: 780, right: 800, bottom: 590, width: 20, height: 30 }) });
  const popup = el({ offsetWidth: 200, offsetHeight: 100 });
  positionPopup(popup, { anchor, align: "left" });
  eq(popup.style.left, "592px", "800 - 200 - 8");
  eq(popup.style.top, "492px", "600 - 100 - 8（名义 594 被夹）");
});

test("[positionPopup] safe-area 地板：无锚右钉视口时 top ≥ safeTop+4；belowToolbars 用注入的 toolbarBottom getter", () => {
  const p1 = el({ offsetWidth: 100, offsetHeight: 50 });
  positionPopup(p1, { anchor: null, align: "right", offsetY: 0 });
  eq(p1.style.top, "24px", "safeTop 20 + 4 地板");
  eq(p1.style.right, "8px");
  configureFloors({ toolbarBottom: () => 150 });
  eq(topToolbarBottom(), 150, "getter 注入生效");
  const anchor = el({ getBoundingClientRect: () => ({ top: 10, left: 0, right: 40, bottom: 40, width: 40, height: 30 }) });
  const p2 = el({ offsetWidth: 100, offsetHeight: 50 });
  positionPopup(p2, { anchor, belowToolbars: true });
  eq(p2.style.top, "154px", "让到顶栏下缘 150 + offsetY 4，而不是 anchor.bottom 44");
  const p3 = el({ offsetWidth: 100, offsetHeight: 50 });
  positionPopup(p3, { anchor, belowToolbars: false });
  eq(p3.style.top, "44px", "不让时仍按 anchor");
});

test("[positionPopup] 隐藏的 popup（量不到宽高）跳过横纵夹，与旧行为一致", () => {
  const anchor = el({ getBoundingClientRect: () => ({ top: 560, left: 780, right: 800, bottom: 590, width: 20, height: 30 }) });
  const popup = el({ offsetWidth: 0, offsetHeight: 0 });
  positionPopup(popup, { anchor, align: "left" });
  eq(popup.style.left, "780px");
  eq(popup.style.top, "594px");
});
