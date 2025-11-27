export {};

declare global {
  type TranslateResult = {
    result: string;
    additional: string;
    detectedLanguage: string;
  };

  interface TranslatePlatform {
    code: string;
    name: string;
    translate: (
      text: string,
      source: string,
      target: string
    ) => Promise<TranslateResult>;
  }
}
