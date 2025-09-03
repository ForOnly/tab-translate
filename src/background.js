chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true, // 点击工具栏图标直接打开侧边栏
  });

  await chrome.sidePanel.setOptions({
    path: "https://translate.google.com/?sl=auto&tl=zh-CN&text=&op=translate",
  });
});

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.action === "updatePanel") {
    const text = encodeURIComponent(msg.text);
    const url = `https://translate.google.com/?sl=auto&tl=zh-CN&text=${text}&op=translate`;

    // 打开 sidePanel 或更新 URL
    // const [tab] = await chrome.tabs.query({
    //   active: true,
    //   currentWindow: true,
    // });

    // 初次打开 panel
    await chrome.sidePanel.setOptions({
      path: url,
    });
  }
});
