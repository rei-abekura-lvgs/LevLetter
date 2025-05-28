import { useState, useMemo } from 'react';
import type { User } from '@shared/schema';

// 日本語名をローマ字に変換する包括的な辞書
const romajiDictionary = {
  // 姓
  '阿部倉': 'abekura',
  '田中': 'tanaka',
  '佐藤': 'sato',
  '鈴木': 'suzuki',
  '高橋': 'takahashi',
  '山田': 'yamada',
  '小林': 'kobayashi',
  '加藤': 'kato',
  '吉田': 'yoshida',
  '山本': 'yamamoto',
  '中村': 'nakamura',
  '小川': 'ogawa',
  '斎藤': 'saito',
  '松本': 'matsumoto',
  '井上': 'inoue',
  '木村': 'kimura',
  '林': 'hayashi',
  '清水': 'shimizu',
  '山口': 'yamaguchi',
  '森': 'mori',
  '牧野': 'makino',
  '石田': 'ishida',
  '安藤': 'ando',
  '稲垣': 'inagaki',
  // 名
  '怜': 'rei',
  '太郎': 'taro',
  '次郎': 'jiro',
  '三郎': 'saburo',
  '花子': 'hanako',
  '美香': 'mika',
  '真一': 'shinichi',
  '健太': 'kenta',
  '康太': 'kota',
  '優': 'yu',
  '翔': 'sho',
  '愛': 'ai',
  '恵': 'megumi',
  '修': 'osamu',
  '聡': 'satoshi',
  '誠': 'makoto',
  '弘輝': 'hiroki',
  '貴義': 'takayoshi',
  '啓介': 'keisuke',
};

export interface SearchFilter {
  type: 'person' | 'department';
  value: string;
}

/**
 * 日本語名をローマ字に変換する関数
 */
export const convertToRomaji = (name: string): string => {
  if (!name) return '';
  
  let result = name;
  
  // 辞書を使って変換
  for (const [kanji, romaji] of Object.entries(romajiDictionary)) {
    result = result.replace(new RegExp(kanji, 'g'), romaji);
  }
  
  return result;
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
      const romanjiKeywords = convertToRomaji(displayName);
      
      return {
        ...user,
        displayName,
        romanjiKeywords,
        searchKeywords: `${displayName} ${romanjiKeywords}`.toLowerCase()
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