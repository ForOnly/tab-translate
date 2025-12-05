export {};

declare global {
  type TranslateResult = {
    result: string;
    additional: string;
    detectedLanguage: string;
  };

  type TranslatePlatformConfig = Record<string, unknown> | undefined | null;

  type CommonTranslatePlatformConfig = TranslatePlatformConfig & {
    apiKey: string;
  };
  type LanguageMapping = Array<Record<string, string>>;
  type BaiduTranslatePlatformConfig = CommonTranslatePlatformConfig & {
    appid: string;
  };

  type PlatformConfigField = {
    key: string; // 配置字段名，如 "apiKey"、"appid"
    label: string; // 表单显示名称
    type: "text" | "password"; // 输入类型
    value?: string; // 当前值
  };

  type TranslatePlatformConfigSchema = PlatformConfigField[];

  interface TranslatePlatform<
    T extends TranslatePlatformConfig = TranslatePlatformConfig
  > {
    code: string;
    name: string;
    languages: LanguageMapping;
    configSchema?: TranslatePlatformConfigSchema;
    getConfig: () => Promise<T>;
    checkPlatform: () => Promise<boolean>;
    translate: (
      text: string,
      source: string,
      target: string
    ) => Promise<TranslateResult>;
  }
}
