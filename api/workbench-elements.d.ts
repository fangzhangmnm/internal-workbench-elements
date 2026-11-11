export declare interface AdoptedPopupOpts extends PopupAnchorOpts {
    /** 节点原本嵌在某容器里（backdrop-filter / overflow 会困住它）→ 收养时搬到 body（一次性）。 */
    mountToBody?: boolean;
    /** 不重定位（节点由 CSS 钉死）——只要外点关/Escape/栈。 */
    position?: "anchor" | "css";
}

/** 显式触发一次全量重钳（和视口事件同一条路）。 */
export declare function clampAllFloatingWindows(): void;

export declare const closeAllPopupMenus: typeof closePopupMenu;

export declare function closeNotice(id: string): void;

/** 全关（下笔 / 切页等外部时机用）。 */
export declare function closePopupMenu(): void;

/** 关某个节点的 popup（不在栈里 → 只确保它 hidden；老调用方「menu.classList.add("hidden")」的替身）。 */
export declare function closePopupMenuOf(el: HTMLElement | null): void;

/** 拖把地板（纯函数）：max(安全区 + 死区底线, HUD 顶排下缘 + 间距)。hudBottom = null → 顶排不可见。 */
export declare function computeTopFloor(safeTop: number, hudBottom: number | null): number;

export declare function configureFloatWindows(c: FloatWindowsConfig): void;

export declare function configureFloors(f: Partial<HostFloors>): void;

/** 最上层的 popup（没有 = null）。 */
export declare function currentPopupMenu(): PopupMenuHandle | null;

/** 当前拖把地板（每次现量：旋转 / 顶排显隐 / 安全区变了都准）。 */
export declare function floatingTopFloor(): number;

export declare interface FloatingWindowHandle {
    readonly el: HTMLElement;
    readonly id: string;
    open(): void;
    close(): void;
    toggle(force?: boolean): boolean;
    isOpen(): boolean;
    raise(): void;
    /** 钳进视口（拖把不进顶边死区、不出屏、不被底边盖住）。藏着时不做。 */
    clamp(): void;
    /** 放到这个位置（钳过）；null = 回 CSS 默认位（清内联样式）。 */
    restore(pos: (PanelPos & {
        width?: number;
        height?: number;
    }) | null): void;
    /** 壳：现在收没收着（没有 collapsible = 永远 false）。 */
    collapsed(): boolean;
    /** 壳：收起 / 恢复（没有 collapsible = 不做）。 */
    setCollapsed(on: boolean): void;
    dispose(): void;
}

export declare interface FloatingWindowSpec {
    id: string;
    /** 拖把（标题栏）。缺省 = 不靠标题栏拖（壳的左上圆钮 / 组件自己拖）。 */
    head?: HTMLElement | null;
    /** 拖把上哪些目标不起拖（关闭钮等）。 */
    ignoreDragOn?: (target: Element) => boolean;
    /** 每次拖动落点（已钳；库已写 left / top）——宿主只管记。 */
    onMove?: (pos: PanelPos) => void;
    resize?: {
        grip: HTMLElement | null;
        min: {
            w: number;
            h: number;
        };
        /** "x" = 只改宽（画画仓的图层窗）。缺省 both。 */
        axis?: "both" | "x";
        /** 起拖时量尺寸；缺省 = 窗的 offset 尺寸。 */
        getSize?: () => {
            w: number;
            h: number;
        };
        /** 自定义落地（缺省 = 库写 style.width[/height]）。给了它，库不碰 style。 */
        apply?: (size: {
            w: number;
            h: number;
        }) => void;
        /** 改完大小的回声（宿主记）。 */
        onResize?: (size: {
            w: number;
            h: number;
        }) => void;
    };
    /** 临时藏窗（画画仓的 transform / crop 这类）期间的去留：缺省 = 从不被藏；给了 = 只在 keepDuring 里的 mode 留下。 */
    transient?: {
        keepDuring: string[];
    };
    /** open / close 的回声（钮的按下态等）。临时藏 / 复原不触发。 */
    onOpenChange?: (open: boolean) => void;
    /** 视口变了（旋转 / 拉窗）时的回调，带当前顶地板——给自己钳制的组件用。 */
    onViewport?: (floor: number) => void;
    /** 藏着时量不到尺寸的兜底（恢复位置时钳用）：缺省 280 × 240。 */
    fallbackSize?: {
        w: number;
        h: number;
    };
    /** 屏底被占掉的高度（px：底部抽屉、软键盘）。拖 / 恢复 / 改大小 / 视口钳制都让出来。缺省 = 0。 */
    bottomFloor?: () => number;
    /** 壳零件（可选）。 */
    shell?: FloatShell;
}

/** 诊断 / 探针：当前栈（id 按 z 升序）。 */
export declare function floatingWindowStack(): string[];

/** 四样可选的壳零件（全不开 = 没有壳）。 */
export declare interface FloatShell {
    /** 左上圆钮：图标的 HTML（宿主拼好，比如 iconHtml("...")）、读屏名、悬停提示（缺省 = 读屏名）。点一下 = 收起 / 恢复（collapsible 开着时）；按住动过 SHELL_KNOB_DRAG_PX = 挪窗。 */
    knob?: {
        iconHtml: string;
        label: string;
        hint?: string;
    };
    /** 能收成小图标（要 knob）：44 px 圆钮、同一个图标、同一个位置；拖 = 挪，点 = 恢复；原来的宽高留着。collapsed = 一开始收没收着；onCollapse = 变了告诉宿主。 */
    collapsible?: {
        collapsed?: boolean;
        onCollapse?: (collapsed: boolean) => void;
    };
    /** 右下斜纹角（19 px，触屏能拖）：库建这个元素当改大小的把手（要给 spec.resize，resize.grip 可以是 null）。 */
    grip?: boolean;
    /** 闲置淡出：SHELL_IDLE_MS 不动 → 零件淡到 0.35；能悬停的设备上指针离窗 → 全隐、进窗即现；拖窗 / 改大小时不淡。宿主自己的小钮加类名 wbe-float-part 也跟着淡。 */
    fade?: boolean;
}

/** 宿主的布局知识（app 级，配一次）。 */
export declare interface FloatWindowsConfig {
    /** HUD 顶排的下缘（px，视口坐标）；null = 顶排不可见。缺省 = host-floors 的 floatingTop()。 */
    hudBottom?: () => number | null;
    /** 显隐用的类名（画画仓 = "hidden"）；缺省 / null = 用 hidden 属性。 */
    hiddenClass?: string | null;
    /** z 序底数的兜底（读不到 CSS 变量 --z-window 时）：缺省 200。 */
    zBase?: number;
}

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

export declare interface PanelPos {
    left: number;
    top: number;
}

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

export declare function raiseFloatingWindow(el: HTMLElement | null): void;

export declare function registerFloatingWindow(el: HTMLElement, spec: FloatingWindowSpec): FloatingWindowHandle;

/** 模态/gate 开合后调（C3 sheet 模块的开合路径）；也可在任何布局变化后调。 */
export declare function relayoutNotices(): void;

export declare function restoreFloatingAfterTransient(): void;

export declare function safeAreaTop(): number;

export declare function showNotice(opts: NoticeOpts): NoticeHandle;

export declare function suppressFloatingForTransient(mode: string): void;

export declare function toggleAdoptedPopup(el: HTMLElement, opts: AdoptedPopupOpts): PopupMenuHandle | null;

/** 锚按钮 toggle 语义：同一锚已开 → 关并返回 null；否则开。 */
export declare function togglePopupMenu<Id extends string>(opts: PopupMenuOpts<Id>): PopupMenuHandle | null;

export declare function topToolbarBottom(): number;

export { }
