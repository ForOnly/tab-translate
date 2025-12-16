// Google Translate
import { readChromeLocal } from "@/utils/chromeUtils";
import MD5 from "crypto-js/md5";

class GooglePlatform implements TranslatePlatform<TranslatePlatformConfig> {
  constructor(
    public code: string = "google",
    public name: string = "Google Translate",
    public languages: LanguageMapping = [
      { name: "自动检测", code: "auto" },
      { code: "en", name: "English" },
      { code: "zh-CN", name: "中文(CN)" },
      { code: "zh-Hans", name: "中文(Hans)" },
      { code: "fr", name: "Français" },
      { code: "de", name: "Deutsch" },
      { code: "ko", name: "한국어" },
      { code: "ja", name: "日本語" },
      { code: "es", name: "Español" },
      { code: "ru", name: "Русский" },
      { code: "it", name: "Italiano" },
      { code: "pt", name: "Português" },
    ],
    public defaultDetectLanguage: string = "zh-CN",
  ) {}

  getConfig(): Promise<TranslatePlatformConfig> {
    return Promise.resolve(null);
  }

  async translate(text: string, source: string, target: string): Promise<TranslateResult> {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dt=bd" +
      `&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}` +
      `&q=${encodeURIComponent(text)}`;
    const response = await fetch(url).then((res) => {
      if (res.status != 200) {
        throw Error("Google Translate Api Error");
      }
      return res.json();
    });
    const result = response[0].map((v: any) => v[0]).join("");
    let additional = "";
    if (response[1]) {
      response[1].forEach((v: any) => {
        additional += `<p class="text-sm font-bold">${v[0]}：</p>`;
        additional += `<div class="h-px bg-slate-300 my-2"></div>`;
        additional += "<ol>" + v[1].map((item: any) => "<li>" + item + "</li>").join("") + "</ol>";
        additional += `<div class="h-px bg-white my-2"></div>`;
      });
    }
    return { result, additional, detectedLanguage: response[2] };
  }
  async checkPlatform(): Promise<boolean> {
    try {
      const resp = await this.translate("hello", "auto", "zh-CN");
      return !!(resp && resp.result);
    } catch (error) {
      console.error("Google Translate加载失败", error);
      return false;
    }
  }
}

// Libre Translate
class LibrePlatform implements TranslatePlatform<CommonTranslatePlatformConfig> {
  constructor(
    public code: string = "libre",
    public name: string = "Libre Translate",
    public languages: LanguageMapping = [
      { name: "自动检测", code: "auto" },
      { code: "en", name: "English" },
      { code: "zh-CN", name: "中文(CN)" },
      { code: "zh-Hans", name: "中文(Hans)" },
      { code: "fr", name: "Français" },
      { code: "de", name: "Deutsch" },
      { code: "ko", name: "한국어" },
      { code: "ja", name: "日本語" },
      { code: "es", name: "Español" },
      { code: "ru", name: "Русский" },
      { code: "it", name: "Italiano" },
      { code: "pt", name: "Português" },
    ],
    public configSchema: PlatformConfigField[] = [{ key: "libre.apiKey", label: "Libre apiKey", type: "text" }],
    public defaultDetectLanguage: string = "zh-CN",
  ) {}

  async getConfig(): Promise<CommonTranslatePlatformConfig> {
    const apiKey = await readChromeLocal("libre.apiKey");
    return { apiKey };
  }

  async translate(text: string, source: string, target: string): Promise<TranslateResult> {
    const url = "https://libretranslate.com/translate";
    const config = await this.getConfig();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: "text",
        api_key: config.apiKey,
      }),
    });
    if (res.status != 200) {
      throw Error("Libre Translate Api Error");
    }
    const data = await res.json();
    if (!data || !data.translatedText) {
      if (data.error) {
        throw Error(data.error);
      }
      throw Error("LibreTranslate Error");
    }
    let additional = "";
    if (data?.alternatives) {
      additional += "<ol>" + data.alternatives.map((item: any) => "<li>" + item + "</li>").join("") + "</ol>";
    }
    return {
      result: data.translatedText,
      additional: additional,
      detectedLanguage: data.detectedLanguage.language,
    };
  }

  async checkPlatform(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      console.log("libre===>", config);
      if (!config || !config.apiKey) {
        return false;
      }

      const resp = await this.translate("hello", "auto", "zh-CN");
      return !!(resp && resp.result);
    } catch (error) {
      console.error("Libre Translate加载失败", error);
      return false;
    }
  }
}

class BaiduTranslatePlatform implements TranslatePlatform<BaiduTranslatePlatformConfig> {
  constructor(
    public code: string = "Baidu",
    public name: string = "Baidu Translate",
    public languages: LanguageMapping = [
      { name: "自动检测", code: "auto" },
      { name: "中文", code: "zh" },
      { name: "英语", code: "en" },

      { name: "粤语", code: "yue" },
      { name: "文言文", code: "wyw" },
      { name: "日语", code: "jp" },

      { name: "韩语", code: "kor" },
      { name: "法语", code: "fra" },
      { name: "西班牙语", code: "spa" },

      { name: "泰语", code: "th" },
      { name: "阿拉伯语", code: "ara" },
      { name: "俄语", code: "ru" },

      { name: "葡萄牙语", code: "pt" },
      { name: "德语", code: "de" },
      { name: "意大利语", code: "it" },

      { name: "希腊语", code: "el" },
      { name: "荷兰语", code: "nl" },
      { name: "波兰语", code: "pl" },

      { name: "保加利亚语", code: "bul" },
      { name: "爱沙尼亚语", code: "est" },
      { name: "丹麦语", code: "dan" },

      { name: "芬兰语", code: "fin" },
      { name: "捷克语", code: "cs" },
      { name: "罗马尼亚语", code: "rom" },

      { name: "斯洛文尼亚语", code: "slo" },
      { name: "瑞典语", code: "swe" },
      { name: "匈牙利语", code: "hu" },

      { name: "繁体中文", code: "cht" },
      { name: "越南语", code: "vie" },
    ],
    public configSchema: PlatformConfigField[] = [
      { key: "baidu.apiKey", label: "Baidu apiKey", type: "text" },
      { key: "baidu.appid", label: "Baidu appid", type: "text" },
    ],
    public defaultDetectLanguage: string = "zh",
  ) {}

  async getConfig(): Promise<BaiduTranslatePlatformConfig> {
    const apiKey = await readChromeLocal("baidu.apiKey");
    const appid = await readChromeLocal("baidu.appid");
    return { apiKey, appid };
  }

  async translate(text: string, source: string, target: string): Promise<TranslateResult> {
    const config = await this.getConfig();
    const url = "https://fanyi-api.baidu.com/api/trans/vip/translate";
    const salt = new Date().getTime();
    const sign_str = config.appid + text + salt + config.apiKey;
    const sign = MD5(sign_str).toString();
    const res = await fetch(
      `${url}?q=${encodeURIComponent(text)}&from=${source}&to=${target}` +
        `&appid=${config.appid}&salt=${salt}&sign=${sign}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    console.log("baidu====>", res);
    if (res.status != 200) {
      throw Error("Baidu Translate Api Error");
    }
    const data = await res.json();
    console.log("baidu data====>", data);
    if (!data || !data.trans_result) {
      if (data) {
        throw Error(data);
      }
      throw Error("BaiduTranslate Error");
    }
    let additional = "";
    if (data?.trans_result) {
      additional += "<ol>" + data.trans_result.map((item: any) => "<li>" + item.dst + "</li>").join("") + "</ol>";
    }
    return {
      result: data.trans_result[0].dst,
      additional: additional,
      detectedLanguage: data.from,
    };
  }

  async checkPlatform(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config || !config.apiKey || !config.appid) {
        return false;
      }
      const resp = await this.translate("hello", "auto", "auto");
      return !!(resp && resp.result);
    } catch (error) {
      console.error("Baidu Translate加载失败", error);
      return false;
    }
  }
}

export { BaiduTranslatePlatform, GooglePlatform, LibrePlatform };
