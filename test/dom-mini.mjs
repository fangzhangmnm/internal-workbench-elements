// 最小 DOM 假件（本包测试专用，零依赖）：只装 positionPopup / safeAreaTop / iconHtml 摸到的那几样。
// 不是 DOM 引擎；元素 = { style, offsetWidth, offsetHeight, getBoundingClientRect, remove }。
export function installMiniDom({ innerWidth = 800, innerHeight = 600, safeTop = 0 } = {}) {
  const mk = (over = {}) => ({ style: {}, offsetWidth: 0, offsetHeight: 0, remove() {}, getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }), ...over });
  globalThis.window = { innerWidth, innerHeight };
  globalThis.document = { createElement: () => mk(), body: { appendChild() {}, removeChild() {} } };
  globalThis.getComputedStyle = () => ({ paddingTop: `${safeTop}px` });
  return { el: mk };
}
