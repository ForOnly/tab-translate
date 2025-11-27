function setupContextMenu() {
  chrome.contextMenus.create({
    id: "google-translate-sidepanel",
    title: "Google Translate Sidepanel",
    contexts: ["selection"],
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true, // 点击工具栏图标直接打开侧边栏
  });
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener((data, tab) => {
  // Make sure the side panel is open.
  chrome.sidePanel.open({ tabId: tab?.id });

  // Store the last word in chrome.storage.session.
  setTimeout(
    () => chrome.storage.session.set({ lastWord: data.selectionText }),
    100
  );
});

chrome.runtime.onMessage.addListener(
  (
    message: { action: string; text?: string },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    console.log("@message=", message);
    if (message.action === "LAST_SELECTION_TEXT") {
      if (message.text) {
        setTimeout(
          () => chrome.storage.session.set({ lastWord: message.text }),
          100
        );
      }
    }
    return true;
  }
);
