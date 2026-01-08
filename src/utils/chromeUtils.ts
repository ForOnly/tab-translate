async function readChromeLocal(key: string): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], function (result) {
      // 如果key不存在，返回空字符串而不是reject
      resolve(result[key] || "");
    });
  });
}

export { readChromeLocal };
