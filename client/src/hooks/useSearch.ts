import { useState, useMemo } from 'react';
import type { User } from '@shared/schema';

// 日本語名をローマ字・ひらがな・カタカナに変換する包括的な辞書
const nameConversionDictionary = {
  // 姓
  '阿部倉': { romaji: 'abekura', hiragana: 'あべくら', katakana: 'アベクラ' },
  '田中': { romaji: 'tanaka', hiragana: 'たなか', katakana: 'タナカ' },
  '佐藤': { romaji: 'sato', hiragana: 'さとう', katakana: 'サトウ' },
  '鈴木': { romaji: 'suzuki', hiragana: 'すずき', katakana: 'スズキ' },
  '高橋': { romaji: 'takahashi', hiragana: 'たかはし', katakana: 'タカハシ' },
  '山田': { romaji: 'yamada', hiragana: 'やまだ', katakana: 'ヤマダ' },
  '小林': { romaji: 'kobayashi', hiragana: 'こばやし', katakana: 'コバヤシ' },
  '加藤': { romaji: 'kato', hiragana: 'かとう', katakana: 'カトウ' },
  '吉田': { romaji: 'yoshida', hiragana: 'よしだ', katakana: 'ヨシダ' },
  '山本': { romaji: 'yamamoto', hiragana: 'やまもと', katakana: 'ヤマモト' },
  '中村': { romaji: 'nakamura', hiragana: 'なかむら', katakana: 'ナカムラ' },
  '小川': { romaji: 'ogawa', hiragana: 'おがわ', katakana: 'オガワ' },
  '斎藤': { romaji: 'saito', hiragana: 'さいとう', katakana: 'サイトウ' },
  '松本': { romaji: 'matsumoto', hiragana: 'まつもと', katakana: 'マツモト' },
  '井上': { romaji: 'inoue', hiragana: 'いのうえ', katakana: 'イノウエ' },
  '木村': { romaji: 'kimura', hiragana: 'きむら', katakana: 'キムラ' },
  '林': { romaji: 'hayashi', hiragana: 'はやし', katakana: 'ハヤシ' },
  '清水': { romaji: 'shimizu', hiragana: 'しみず', katakana: 'シミズ' },
  '山口': { romaji: 'yamaguchi', hiragana: 'やまぐち', katakana: 'ヤマグチ' },
  '森': { romaji: 'mori', hiragana: 'もり', katakana: 'モリ' },
  '牧野': { romaji: 'makino', hiragana: 'まきの', katakana: 'マキノ' },
  '石田': { romaji: 'ishida', hiragana: 'いしだ', katakana: 'イシダ' },
  '安藤': { romaji: 'ando', hiragana: 'あんどう', katakana: 'アンドウ' },
  '稲垣': { romaji: 'inagaki', hiragana: 'いながき', katakana: 'イナガキ' },
  // 名
  '怜': { romaji: 'rei', hiragana: 'れい', katakana: 'レイ' },
  '太郎': { romaji: 'taro', hiragana: 'たろう', katakana: 'タロウ' },
  '次郎': { romaji: 'jiro', hiragana: 'じろう', katakana: 'ジロウ' },
  '三郎': { romaji: 'saburo', hiragana: 'さぶろう', katakana: 'サブロウ' },
  '花子': { romaji: 'hanako', hiragana: 'はなこ', katakana: 'ハナコ' },
  '美香': { romaji: 'mika', hiragana: 'みか', katakana: 'ミカ' },
  '真一': { romaji: 'shinichi', hiragana: 'しんいち', katakana: 'シンイチ' },
  '健太': { romaji: 'kenta', hiragana: 'けんた', katakana: 'ケンタ' },
  '康太': { romaji: 'kota', hiragana: 'こうた', katakana: 'コウタ' },
  '優': { romaji: 'yu', hiragana: 'ゆう', katakana: 'ユウ' },
  '翔': { romaji: 'sho', hiragana: 'しょう', katakana: 'ショウ' },
  '愛': { romaji: 'ai', hiragana: 'あい', katakana: 'アイ' },
  '恵': { romaji: 'megumi', hiragana: 'めぐみ', katakana: 'メグミ' },
  '修': { romaji: 'osamu', hiragana: 'おさむ', katakana: 'オサム' },
  '聡': { romaji: 'satoshi', hiragana: 'さとし', katakana: 'サトシ' },
  '誠': { romaji: 'makoto', hiragana: 'まこと', katakana: 'マコト' },
  '弘輝': { romaji: 'hiroki', hiragana: 'ひろき', katakana: 'ヒロキ' },
  '貴義': { romaji: 'takayoshi', hiragana: 'たかよし', katakana: 'タカヨシ' },
  '啓介': { romaji: 'keisuke', hiragana: 'けいすけ', katakana: 'ケイスケ' },
};

export interface SearchFilter {
  type: 'person' | 'department';
  value: string;
}

/**
 * 日本語名を検索可能な形式に変換する関数
 */
export const convertToSearchableFormats = (name: string): {
  romaji: string;
  hiragana: string;
  katakana: string;
  combined: string;
} => {
  if (!name) return { romaji: '', hiragana: '', katakana: '', combined: '' };
  
  let romaji = name;
  let hiragana = name;
  let katakana = name;
  
  // 辞書を使って変換
  for (const [kanji, conversions] of Object.entries(nameConversionDictionary)) {
    const regex = new RegExp(kanji, 'g');
    romaji = romaji.replace(regex, conversions.romaji);
    hiragana = hiragana.replace(regex, conversions.hiragana);
    katakana = katakana.replace(regex, conversions.katakana);
  }
  
  // すべての形式を結合した検索用文字列
  const combined = `${name} ${romaji} ${hiragana} ${katakana}`.toLowerCase();
  
  return { romaji, hiragana, katakana, combined };
};

/**
 * 旧関数との互換性を保つためのラッパー
 */
export const convertToRomaji = (name: string): string => {
  return convertToSearchableFormats(name).romaji;
};

/**
 * 検索・フィルタリング機能を提供するカスタムフック
 */
export const useSearch = (allUsers: User[] = []) => {
  const [filterValue, setFilterValue] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // 部署のユニークリストを生成
  const uniqueDepartments = useMemo(() => {
    const departments = allUsers
      .map(user => user.department)
      .filter(Boolean)
      .filter((dept, index, arr) => arr.indexOf(dept) === index);
    
    return departments.sort();
  }, [allUsers]);

  // 検索可能な人名データの準備
  const searchableUsers = useMemo(() => {
    return allUsers.map(user => {
      const displayName = user.displayName || user.name;
      const searchFormats = convertToSearchableFormats(displayName);
      
      return {
        ...user,
        displayName,
        ...searchFormats,
        searchKeywords: searchFormats.combined
      };
    });
  }, [allUsers]);

  // 選択した部署のメンバーを取得
  const departmentMembers = useMemo(() => {
    if (!selectedDepartment) return [];
    
    return searchableUsers.filter(user => user.department === selectedDepartment);
  }, [searchableUsers, selectedDepartment]);

  // フィルターをクリア
  const clearFilters = () => {
    setSelectedFilter(null);
    setSelectedDepartment(null);
    setFilterValue("");
  };

  // フィルターを適用
  const applyPersonFilter = (displayName: string) => {
    setSelectedFilter({ type: 'person', value: displayName });
    setSearchOpen(false);
  };

  const applyDepartmentFilter = (department: string) => {
    setSelectedFilter({ type: 'department', value: department });
    setSelectedDepartment(department);
    setSearchOpen(false);
  };

  return {
    // State
    filterValue,
    setFilterValue,
    searchOpen,
    setSearchOpen,
    selectedFilter,
    selectedDepartment,
    
    // Computed values
    uniqueDepartments,
    searchableUsers,
    departmentMembers,
    
    // Actions
    clearFilters,
    applyPersonFilter,
    applyDepartmentFilter,
  };
};