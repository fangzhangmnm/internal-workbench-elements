export declare interface AdoptedPopupOpts extends PopupAnchorOpts {
    /** 节点原本嵌在某容器里（backdrop-filter / overflow 会困住它）→ 收养时搬到 body（一次性）。 */
    mountToBody?: boolean;
    /** 不重定位（节点由 CSS 钉死）——只要外点关/Escape/栈。 */
    position?: "anchor" | "css";
}

/** 所有开着的窗重钳一遍、再叫各自的 onViewport（和视口事件同一条路）。宿主布局变了（抽屉开合这类）时调。 */
export declare function clampAllFloatingWindows(): void;

export declare const closeAllPopupMenus: typeof closePopupMenu;

export declare function closeNotice(id: string): void;

/** 全关（下笔 / 切页等外部时机用）。 */
export declare function closePopupMenu(): void;

/** 关某个节点的 popup（不在栈里 → 只确保它 hidden；老调用方「menu.classList.add("hidden")」的替身）。 */
export declare function closePopupMenuOf(el: HTMLElement | null): void;

/** 顶地板（纯函数）：max(安全区 + 24（iOS 顶边不上报的触摸死区）, HUD 顶排下缘 + 4)。hudBottom = null = 顶排看不见。 */
export declare function computeTopFloor(safeTop: number, hudBottom: number | null): number;

/** 配宿主的布局知识（只改给了的项；可以再调，后调的盖先调的）。不调 = FloatingWindowsConfig 里写的缺省。 */
export declare function configureFloatingWindows(c: FloatingWindowsConfig): void;

export declare function configureFloors(f: Partial<HostFloors>): void;

/** 最上层的 popup（没有 = null）。 */
export declare function currentPopupMenu(): PopupMenuHandle | null;

/** 现在的顶地板（px）：浮窗拖把的上沿不高过它。= computeTopFloor(安全区, hudBottom())，每次现量（旋转 / 顶排显隐 / 安全区变了都准）。 */
export declare function floatingTopFloor(): number;

/** 注册之后拿到的手柄。 */
export declare interface FloatingWindowHandle {
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
    restore(pos: (PanelPos & {
        width?: number;
        height?: number;
    }) | null): void;
    /** 壳：现在收没收着（没开 collapsible = 永远 false）。 */
    collapsed(): boolean;
    /** 壳：收起 / 恢复（没开 collapsible = 不做；变了才叫 onCollapse）。 */
    setCollapsed(on: boolean): void;
    /** 拆：摘掉库挂的所有监听和计时器、出 z 栈。元素本身留给宿主。 */
    dispose(): void;
}

/** 宿主的布局知识（app 级，开机配一次；不调 configureFloatingWindows = 下面每一项的缺省）。 */
export declare interface FloatingWindowsConfig {
    /** HUD 顶排的下缘（px，视口坐标），浮窗的拖把不进到它上面；返回 null = 顶排现在看不见。每次钳制现量。不给 = 用 host-floors 的 floors.floatingTop()（没配过 floors = 安全区）。 */
    hudBottom?: () => number | null;
    /** 显隐用的类名（画画仓 = "hidden"：有这个类 = 藏着）。不给 / 给 null = 用元素的 hidden 属性。 */
    hiddenClass?: string | null;
    /** z 序底数的兜底：先读宿主 :root 的 CSS 变量 --z-window，读不到才用它。不给 = 200。第 i 扇（从下往上）的 z-index = 底数 + i。 */
    zBase?: number;
}

/** 四样可选的壳零件（一样都不给 = 没有壳，和 0.1.x 宿主自己的浮窗一模一样）。样子在 workbench-elements.css 的 .wbe-float-*。 */
export declare interface FloatingWindowShell {
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
export declare interface FloatingWindowSpec {
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
        min: {
            w: number;
            h: number;
        };
        /** "x" = 只改宽（画画仓的图层窗，高归宿主）。不给 = "both"。 */
        axis?: "both" | "x";
        /** 起拖时量现在的尺寸。不给 = 窗的 offsetWidth / offsetHeight。 */
        getSize?: () => {
            w: number;
            h: number;
        };
        /** 自己落地尺寸。给了它库就不写 style.width / height（也不做「太大先缩」）。不给 = 库写行内宽高。 */
        apply?: (size: {
            w: number;
            h: number;
        }) => void;
        /** 改完大小的回声（宿主记）。不给 = 不报。 */
        onResize?: (size: {
            w: number;
            h: number;
        }) => void;
    };
    /** 宿主进「临时藏窗」的模式时这扇窗的去留（见 suppressFloatingForTransient）。keepDuring = 这些模式里留着；模式的名字是宿主自己起的字符串，库只拿来比相等。不给 = 从不被临时藏。 */
    transient?: {
        keepDuring: string[];
    };
    /** open / close 的回声（钮的按下态这类）。临时藏 / 复原不叫它。不给 = 不报。 */
    onOpenChange?: (open: boolean) => void;
    /** 视口变了（旋转 / 拉窗 / 宿主调 clampAllFloatingWindows）、库重钳完之后叫，带现在的顶地板——给自己再钳一遍里面东西的组件用。不给 = 不叫。 */
    onViewport?: (floor: number) => void;
    /** 藏着时量不到尺寸，恢复位置钳的时候用它当窗的大小。不给 = 280 × 240。 */
    fallbackSize?: {
        w: number;
        h: number;
    };
    /** 屏底被占掉的高度（px：底部抽屉、软键盘），每次钳制现量：拖 / 恢复 / 改大小 / 视口钳制都让出来，右下角不被盖住；给了它的窗也跟 visualViewport 重钳。不给 = 0。 */
    bottomFloor?: () => number;
    /** 壳零件。不给 = 没有壳。 */
    shell?: FloatingWindowShell;
}

/** 诊断 / 探针：现在注册着的窗的 id，按 z 从下往上。 */
export declare function floatingWindowStack(): string[];

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

/** 浮窗左上角在视口里的位置（CSS px）。 */
export declare interface PanelPos {
    /** 离视口左边。 */
    left: number;
    /** 离视口上边。 */
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

/** 按元素置顶（没注册过 / null = 不做）。 */
export declare function raiseFloatingWindow(el: HTMLElement | null): void;

/** 把一个宿主建好的元素登记成浮窗（先藏着；第一次 open 才置顶）。同一个元素再登记 = 先拆旧的。shell 的组合不对（见 FloatingWindowShell）= 抛。 */
export declare function registerFloatingWindow(el: HTMLElement, spec: FloatingWindowSpec): FloatingWindowHandle;

/** 模态/gate 开合后调（C3 sheet 模块的开合路径）；也可在任何布局变化后调。 */
export declare function relayoutNotices(): void;

/** 出那个模式：只把上一次 suppressFloatingForTransient 藏起来的窗放回来。 */
export declare function restoreFloatingAfterTransient(): void;

export declare function safeAreaTop(): number;

export declare function showNotice(opts: NoticeOpts): NoticeHandle;

/** 宿主进一个「临时藏窗」的模式（画画仓的变形 / 裁切这类）：开着的、给了 spec.transient、keepDuring 里没有这个模式的窗先藏起来（不叫 onOpenChange）。连着调 = 先复原再按新模式藏。 */
export declare function suppressFloatingForTransient(mode: string): void;

export declare function toggleAdoptedPopup(el: HTMLElement, opts: AdoptedPopupOpts): PopupMenuHandle | null;

/** 锚按钮 toggle 语义：同一锚已开 → 关并返回 null；否则开。 */
export declare function togglePopupMenu<Id extends string>(opts: PopupMenuOpts<Id>): PopupMenuHandle | null;

export declare function topToolbarBottom(): number;

export { }
