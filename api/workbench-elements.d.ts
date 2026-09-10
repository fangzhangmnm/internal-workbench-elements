export declare interface AdoptedPopupOpts extends PopupAnchorOpts {
    /** 节点原本嵌在某容器里（backdrop-filter / overflow 会困住它）→ 收养时搬到 body（一次性）。 */
    mountToBody?: boolean;
    /** 不重定位（节点由 CSS 钉死）——只要外点关/Escape/栈。 */
    position?: "anchor" | "css";
}

export declare const closeAllPopupMenus: typeof closePopupMenu;

export declare function closeNotice(id: string): void;

/** 全关（下笔 / 切页等外部时机用）。 */
export declare function closePopupMenu(): void;

/** 关某个节点的 popup（不在栈里 → 只确保它 hidden；老调用方「menu.classList.add("hidden")」的替身）。 */
export declare function closePopupMenuOf(el: HTMLElement | null): void;

export declare function configureFloors(f: Partial<HostFloors>): void;

/** 最上层的 popup（没有 = null）。 */
export declare function currentPopupMenu(): PopupMenuHandle | null;

export declare const floors: Readonly<HostFloors>;

export declare interface HostFloors {
    /** 顶部工具条群的下缘（px，视口坐标）——popup belowToolbars / notice docked-top 用。 */
    toolbarBottom: () => number;
    /** 浮窗/停靠通知的顶地板（px）——默认 = 顶栏下缘。 */
    floatingTop: () => number;
}

/** 图标的 HTML 字符串（给 innerHTML / v-html / 模板拼接用）。 */
export declare function iconHtml(name: IconName, opts?: {
    size?: number;
    cls?: string;
}): string;

export declare type IconName = string;

export declare function isNoticeOpen(id: string): boolean;

export declare function isPopupOpen(el: HTMLElement | null): boolean;

export declare interface NoticeAction {
    label: string;
    onClick: () => void;
    primary?: boolean;
}

export declare function noticeCount(): number;

export declare interface NoticeHandle {
    readonly el: HTMLElement;
    readonly id: string;
    setText(text: string): void;
    close(): void;
    isOpen(): boolean;
}

export declare type NoticeLevel = "neutral" | "info" | "warning" | "error";

export declare interface NoticeOpts {
    id?: string;
    level?: NoticeLevel;
    text: string;
    actions?: NoticeAction[];
    dismissible?: boolean;
    dismissLabel?: string;
    tapToDismiss?: boolean;
    autoHideMs?: number;
    onDismiss?: () => void;
    ariaLive?: "polite" | "assertive";
}

/** 收养静态节点：显示 + 锚定 + 栈 + 外点关/Escape；关 = 加 hidden（节点留在 DOM，内容仍是 index.html 的）。 */
export declare function openAdoptedPopup(el: HTMLElement, opts: AdoptedPopupOpts): PopupMenuHandle;

export declare function openPopupMenu<Id extends string>(opts: PopupMenuOpts<Id>): PopupMenuHandle;

/** 现建 / 收养共用的锚定与关闭选项。 */
export declare interface PopupAnchorOpts {
    anchor: HTMLElement;
    align?: "left" | "right";
    offsetY?: number;
    belowToolbars?: boolean;
    edgeMargin?: number;
    /** z band：现建默认 menu；收养默认 "css"（保留节点自己的 CSS z）。菜单内再弹 = popover；sheet(modal) 内 = modal。 */
    band?: PopupBand | "css";
    swallowOutsideTap?: boolean;
    onClose?: () => void;
    ariaLabel?: string;
}

export declare type PopupBand = "menu" | "popover" | "modal";

export declare interface PopupMenuHandle {
    close(): void;
    /** 现建：重绘 items + 重定位；收养：重定位。 */
    refresh(): void;
    readonly isOpen: boolean;
    readonly el: HTMLElement;
    readonly anchor: HTMLElement;
}

export declare interface PopupMenuItem<Id extends string = string> {
    id: Id;
    label: string;
    icon?: string;
    hidden?: boolean;
    disabled?: boolean;
    danger?: boolean;
    checked?: boolean;
    separatorBefore?: boolean;
    header?: boolean;
}

export declare interface PopupMenuOpts<Id extends string = string> extends PopupAnchorOpts {
    items: () => PopupMenuItem<Id>[];
    /** 返回 "keep" = 选了但菜单不关（随后请 refresh）。 */
    onPick: (id: Id, item: PopupMenuItem<Id>) => void | "keep";
    variant?: PopupVariant;
}

export declare type PopupVariant = "list" | "compact";

declare interface PositionOpts {
    anchor?: HTMLElement | null;
    align?: "left" | "right";
    offsetY?: number;
    edgeMargin?: number;
    belowToolbars?: boolean;
    clampViewport?: boolean;
}

export declare function positionPopup(popupEl: HTMLElement | null, opts?: PositionOpts): void;

/** 模态/gate 开合后调（C3 sheet 模块的开合路径）；也可在任何布局变化后调。 */
export declare function relayoutNotices(): void;

export declare function safeAreaTop(): number;

export declare function showNotice(opts: NoticeOpts): NoticeHandle;

export declare function toggleAdoptedPopup(el: HTMLElement, opts: AdoptedPopupOpts): PopupMenuHandle | null;

/** 锚按钮 toggle 语义：同一锚已开 → 关并返回 null；否则开。 */
export declare function togglePopupMenu<Id extends string>(opts: PopupMenuOpts<Id>): PopupMenuHandle | null;

export declare function topToolbarBottom(): number;

export { }
