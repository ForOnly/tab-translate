// Google Translate
const googlePlatform: TranslatePlatform = {
  code: "google",
  name: "Google Translate",
  translate: async (text, source, target) => {
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
        additional += "<h3>" + v[0] + "</h3>";
        additional +=
          "<ol>" +
          v[1].map((item: any) => "<li>" + item + "</li>").join("") +
          "</ol>";
      });
    }
    return { result, additional, detectedLanguage: response[2] };
  },
};

// LibreTranslate (示例)
const librePlatform: TranslatePlatform = {
  code: "libre",
  name: "LibreTranslate",
  translate: async (text, source, target) => {
    const url = "https://libretranslate.com/translate";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: "text",
        api_key: "",
        secret: "3NN7MMH",
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
      additional +=
        "<ol>" +
        data.alternatives.map((item: any) => "<li>" + item + "</li>").join("") +
        "</ol>";
    }
    return {
      result: data.translatedText,
      additional: additional,
      detectedLanguage: data.detectedLanguage.language,
    };
  },
};

export { googlePlatform, librePlatform };
