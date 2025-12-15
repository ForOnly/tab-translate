import { ChromeMessageKeyEnum } from "@/types/contants";

let debounceTimer: number | undefined;
let lastText: string = "";
document.addEventListener("selectionchange", () => {
  clearTimeout(debounceTimer);
  console.log("ChromeMessageKeyEnum.LAST_SELECTION_TEXT:", ChromeMessageKeyEnum.LAST_SELECTION_TEXT);
  debounceTimer = setTimeout(() => {
    const text = window.getSelection()?.toString().trim();
    if (!text || text === lastText) return;
    lastText = text;
    chrome?.runtime?.sendMessage &&
      chrome.runtime.sendMessage({
        action: ChromeMessageKeyEnum.LAST_SELECTION_TEXT,
        text: lastText,
      });
  }, 200); // 停止选中 400ms 后触发
});
