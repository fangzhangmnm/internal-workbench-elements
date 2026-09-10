import { test, eq, assert } from "./runner.mjs";
const { iconHtml } = await import("../src/icon.ts");
test("[icon] iconHtml 只拼 <use href=\"#name\">，sprite 归宿主", () => {
  const h = iconHtml("trash-can");
  assert(h.includes('href="#trash-can"'), h);
  assert(h.startsWith("<svg"), h);
});
