import CryptoJS from "crypto-js";

function debounce(fn: Function, delay = 400) {
  let timer: any = null;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * 使用 crypto-js 生成指定长度的安全随机字符串（hex 格式）
 * length 表示要输出的字符数量（而不是字节数）
 */
function secureRandomString(length: number): string {
  // crypto-js 按“字”生成，每个 word = 4 字节 = 8 hex 字符
  const bytesNeeded = Math.ceil(length / 2);

  // 生成安全随机字节
  const wordArray = CryptoJS.lib.WordArray.random(bytesNeeded);

  // 转 hex 字符串
  const hex = wordArray.toString(CryptoJS.enc.Hex);

  // 根据用户要求裁切长度
  return hex.slice(0, length);
}

export { debounce, secureRandomString };
