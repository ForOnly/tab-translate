document.addEventListener("mouseup", () => {
  const text = window.getSelection().toString().trim();
  if (!text) return;
  chrome?.runtime?.sendMessage &&
    chrome.runtime.sendMessage({ action: "updatePanel", text });
});
