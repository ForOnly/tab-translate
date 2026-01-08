import CryptoJS from "crypto-js";

function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay = 400) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Fetch with timeout
 * @param url Request URL
 * @param options Fetch options
 * @param timeout Timeout in milliseconds (default: 10000)
 */
async function fetchWithTimeout(url: string, options?: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
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

export { debounce, secureRandomString, fetchWithTimeout };
