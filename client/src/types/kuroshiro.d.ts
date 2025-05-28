declare module 'kuroshiro' {
  interface ConvertOptions {
    to?: 'hiragana' | 'katakana' | 'romaji';
    mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
  }

  class Kuroshiro {
    init(analyzer: any): Promise<void>;
    convert(text: string, options?: ConvertOptions): Promise<string>;
  }

  export = Kuroshiro;
}

declare module 'kuroshiro-analyzer-kuromoji' {
  class KuromojiAnalyzer {
    constructor();
  }
  export = KuromojiAnalyzer;
}