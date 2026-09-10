// @internal/workbench-elements 门牌——出生 2026-09-09（Claude Fable 5.1；CatsUp 总账 A5，user 2026-09-06「也是近期要做的」）。
// 四个原子 = WeebPaint src/ui/{popup-menu,notice,icon}.ts + src/anchored-popup.ts 的 WET 拷贝，签名以 WeebPaint api/ 为准，不改语义。
// 宿主布局知识（顶栏下缘 / 浮窗顶地板）经 configureFloors 注入；sprite 归宿主，包只拼 <use>；CSS 见 src/workbench-elements.css，token 由宿主 :root 提供。
export { configureFloors, floors, safeAreaTop, type HostFloors } from "./host-floors.ts";
export { topToolbarBottom, positionPopup } from "./anchored-popup.ts";
export { iconHtml, type IconName } from "./icon.ts";
export {
  currentPopupMenu, closePopupMenu, closeAllPopupMenus, closePopupMenuOf, isPopupOpen,
  togglePopupMenu, toggleAdoptedPopup, openPopupMenu, openAdoptedPopup,
  type PopupBand, type PopupVariant, type PopupMenuItem, type PopupAnchorOpts, type PopupMenuOpts, type AdoptedPopupOpts, type PopupMenuHandle,
} from "./popup-menu.ts";
export {
  relayoutNotices, showNotice, closeNotice, noticeCount, isNoticeOpen,
  type NoticeLevel, type NoticeAction, type NoticeOpts, type NoticeHandle,
} from "./notice.ts";
