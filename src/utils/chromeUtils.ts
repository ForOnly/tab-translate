async function readChromeLocal(key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
        reject(`readChromeLocal:result[${key}] === undefined`);
      } else {
        resolve(result[key]);
      }
    });
  });
}

export { readChromeLocal };
