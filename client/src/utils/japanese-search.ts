import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

let kuroshiro: Kuroshiro | null = null;

// Kuroshiroの初期化
async function initKuroshiro() {
  if (!kuroshiro) {
    kuroshiro = new Kuroshiro();
    await kuroshiro.init(new KuromojiAnalyzer());
  }
  return kuroshiro;
}

// 漢字をひらがな・カタカナに変換
export async function convertToKana(text: string): Promise<{
  hiragana: string;
  katakana: string;
}> {
  try {
    const kuro = await initKuroshiro();
    const hiragana = await kuro.convert(text, { to: 'hiragana' });
    const katakana = await kuro.convert(text, { to: 'katakana' });
    
    return { hiragana, katakana };
  } catch (error) {
    console.warn('日本語変換エラー:', error);
    return { hiragana: text, katakana: text };
  }
}

// 検索対象テキストを生成（漢字、ひらがな、カタカナ、ローマ字を含む）
export async function generateSearchableText(originalText: string): Promise<string[]> {
  const searchableTexts: string[] = [originalText.toLowerCase()];
  
  try {
    const { hiragana, katakana } = await convertToKana(originalText);
    searchableTexts.push(hiragana.toLowerCase());
    searchableTexts.push(katakana.toLowerCase());
    
    // スペースを除去したバージョンも追加
    searchableTexts.push(originalText.replace(/\s+/g, '').toLowerCase());
    searchableTexts.push(hiragana.replace(/\s+/g, '').toLowerCase());
    searchableTexts.push(katakana.replace(/\s+/g, '').toLowerCase());
  } catch (error) {
    console.warn('検索テキスト生成エラー:', error);
  }
  
  return searchableTexts;
}

// 検索クエリに対してマッチするかチェック
export async function isSearchMatch(query: string, targetText: string): Promise<boolean> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return true;
  
  const searchableTexts = await generateSearchableText(targetText);
  
  return searchableTexts.some(text => text.includes(normalizedQuery));
}