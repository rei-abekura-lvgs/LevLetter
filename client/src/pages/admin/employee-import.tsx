import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle2, Info, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { apiRequest } from "@/lib/queryClient";

// インポート結果の型定義
interface ImportResult {
  success: boolean;
  newUsers: number;
  updatedUsers: number;
  errors: string[];
}

// 従業員データの型定義
interface CsvEmployee {
  email: string;
  name: string;
  employeeId: string;
  displayName?: string;
  department?: string;
}

// 社内DBの形式に合わせた型定義
interface CompanyEmployee {
  // 社員番号
  employeeId: string;
  // 氏名
  name: string;
  // 職場氏名
  displayName?: string;
  // 会社メールアドレス
  email: string;
  // 所属部門
  department?: string;
  // 6段階の組織階層情報
  organizationLevel1?: string | null;
  organizationLevel2?: string | null;
  organizationLevel3?: string | null;
  organizationLevel4?: string | null;
  organizationLevel5?: string | null;
  organizationLevel6?: string | null;
}

// 従業員データをインポートする関数
async function importEmployeesData(employees: CsvEmployee[]): Promise<ImportResult> {
  // デバッグ用：インポート前のデータをログ出力（詳細版）
  console.log('■■■■■■ インポート前のデータ詳細 ■■■■■■');
  console.log('データ件数:', employees?.length || 0);
  console.log('データサンプル:', employees?.slice(0, 3));
  if (employees?.length > 0) {
    console.log('1件目の内容:', JSON.stringify(employees[0], null, 2));
    console.log('データ型:', typeof employees[0]);
    console.log('プロパティ一覧:', Object.keys(employees[0]));
    
    // 組織階層データの詳細チェック
    console.log('🏢 1件目の組織階層データ詳細:', {
      organizationLevel1: employees[0].organizationLevel1,
      organizationLevel2: employees[0].organizationLevel2,
      organizationLevel3: employees[0].organizationLevel3,
      organizationLevel4: employees[0].organizationLevel4,
      organizationLevel5: employees[0].organizationLevel5,
      organizationLevel6: employees[0].organizationLevel6
    });
  }
  console.log('■■■■■■ インポート前のデータ詳細(終わり) ■■■■■■');
  
  if (!employees || employees.length === 0) {
    console.error('エラー: 有効な従業員データがありません', {
      受け取ったデータ: employees,
      データ型: typeof employees,
      長さ: employees?.length
    });
    throw new Error('有効な従業員データがありません。データマッピングに問題がある可能性があります。');
  }
  
  try {
    return await apiRequest<ImportResult>("POST", "/api/admin/users/import", {
      employees: employees
    });
  } catch (error) {
    console.error('インポートAPI呼び出しエラー:', error);
    
    // エラーレスポンスの詳細情報を取得
    const errorMessage = error instanceof Error 
      ? error.message 
      : '不明なエラーが発生しました';
    
    // 認証エラーの場合の処理
    if (errorMessage.includes('認証') || errorMessage.includes('401')) {
      return {
        success: false,
        newUsers: 0,
        updatedUsers: 0,
        errors: ['認証エラー: 管理者としてログインしているか確認してください。']
      };
    }
    
    // 他のAPIエラーの場合
    return {
      success: false,
      newUsers: 0,
      updatedUsers: 0,
      errors: [errorMessage]
    };
  }
}

const SAMPLE_CSV = `社員番号,氏名,職場氏名,会社メールアドレス,所属コード,所属階層１,所属階層２,所属階層３,所属階層４,所属階層５,勤務地コード,勤務地名,職種コード,職種名,雇用区分,入社日,PLコード
E001,田中太郎,タナカ,tanaka@example.com,S001,営業本部,第一営業部,,,,T01,東京本社,J01,営業,正社員,2020/04/01,PL001
E002,山田花子,ヤマダ,yamada@example.com,M001,事業推進本部,マーケティング部,,,,T01,東京本社,J02,マーケティング,正社員,2019/10/01,PL002
E003,鈴木一郎,スズキ,suzuki@example.com,D001,技術本部,開発部,フロントエンド課,,,O01,大阪支社,J03,エンジニア,正社員,2021/07/01,PL003
E004,佐藤太一,サトウ,sato@example.com,EX001,役員,,,,,T01,東京本社,J10,役員,役員,2015/01/01,
E005,高橋恵子,タカハシ,takahashi@example.com,NULL,その他,,,,,T01,東京本社,J05,総務,正社員,2022/04/01,PL005`;

export default function EmployeeImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvEmployee[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルのパース（CSVまたはExcelまたはTSV）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    // ファイル名とファイルタイプの情報をログ出力（デバッグ用）
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    console.log('ファイル情報:', {
      名前: selectedFile.name,
      拡張子: fileExt,
      タイプ: selectedFile.type,
      サイズ: `${(selectedFile.size / 1024).toFixed(2)} KB`
    });
    
    // ファイル形式に応じてパース処理を分岐
    if (fileExt === 'csv' || fileExt === 'txt' || fileExt === 'tsv') {
      // CSVまたはTSVファイルのパース
      // ファイルの内容を一度読み込んで、区切り文字を自動検出
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) return;
        
        // ファイル内容の最初の数行を確認
        const lines = content.split('\n').slice(0, 5);
        console.log('ファイル内容サンプル:', lines);
        
        // タブが含まれているかチェック
        const hasTab = lines.some(line => line.includes('\t'));
        console.log('タブ区切り判定:', hasTab);
        
        // 自動検出した区切り文字を使用
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          delimiter: hasTab ? '\t' : ',',
          complete: (results) => {
            console.log('■■■■■■ パース結果詳細 ■■■■■■');
            console.log('パース結果:', results);
            console.log('パース結果のヘッダー:', results.meta.fields);
            console.log('行数:', results.data.length);
            if (results.data.length > 0) {
              console.log('パース結果の最初の行:', results.data[0]);
              console.log('データ型:', typeof results.data[0]);
              if (results.data[0] && typeof results.data[0] === 'object') {
                console.log('プロパティ一覧:', Object.keys(results.data[0] as object));
              }
            }
            
            // CSV/TSVパースデータのフィールドをマッピング
            const mappedData = results.data.map((row: any) => {
              console.log('処理中の行:', row);
            
              // 会社DBの形式かチェック（CSVファイルの場合）
              if (row["会社メールアドレス"] !== undefined || row["社員番号"] !== undefined) {
                // 所属階層１〜５から組織階層を取得
                const dept1 = row["所属階層１"] || null; // 本部
                const dept2 = row["所属階層２"] || null; // 部
                const dept3 = row["所属階層３"] || null; // グループ
                const dept4 = row["所属階層４"] || null; // チーム
                const dept5 = row["所属階層５"] || null; // ユニット
                
                // 階層をスラッシュで連結（空の階層は除外）
                const departmentParts = [dept1, dept2, dept3, dept4, dept5].filter(d => d !== null && d !== '');
                const departmentPath = departmentParts.join('/');
                
                console.log('部門階層分解:', {
                  dept1, dept2, dept3, dept4, dept5,
                  departmentPath
                });
                
                const mappedEmployee = {
                  email: row["会社メールアドレス"] || '',
                  name: row["職場氏名"] || row["氏名"] || '',
                  employeeId: String(row["社員番号"] || ''),
                  department: departmentPath,
                  organizationLevel1: "レバレジーズ株式会社", // 会社レベル
                  organizationLevel2: dept1, // 本部レベル
                  organizationLevel3: dept2, // 部門レベル
                  organizationLevel4: dept3, // グループレベル
                  organizationLevel5: dept4, // チームレベル
                  organizationLevel6: dept5  // ユニットレベル
                };
                
                console.log('🏢 マッピング後の組織階層データ:', {
                  email: mappedEmployee.email,
                  levels: {
                    level1: mappedEmployee.organizationLevel1,
                    level2: mappedEmployee.organizationLevel2,
                    level3: mappedEmployee.organizationLevel3,
                    level4: mappedEmployee.organizationLevel4,
                    level5: mappedEmployee.organizationLevel5,
                    level6: mappedEmployee.organizationLevel6
                  }
                });
                
                return mappedEmployee;
              } else {
                // 従来のCSV形式の場合はそのまま
                return row;
              }
            });
            
            console.log('マッピング後のデータ:', mappedData.slice(0, 3));
            
            // 必須フィールドのチェック
            const validData = mappedData.filter((row: any) => {
              const isValid = row.email && row.name && row.employeeId;
              if (!isValid) {
                console.log('無効なデータ行:', row);
              }
              return isValid;
            }) as CsvEmployee[];
            
            console.log('有効なデータ件数:', validData.length);
            setPreview(validData.slice(0, 10)); // 先頭10件をプレビュー表示
            setIsPreviewMode(true);
          },
          error: (error) => {
            console.error('ファイルパースエラー:', error);
            toast({
              title: 'エラー',
              description: `ファイルの解析に失敗しました: ${error.message}`,
              variant: 'destructive',
            });
          }
        });
      };
      
      reader.readAsText(selectedFile);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      // Excelファイルのパース
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) return;
          
          // Excelファイルを読み込み
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // 最初のシートのデータを取得
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // シートデータをJSONに変換
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          
          console.log('Excelパース結果:', jsonData.slice(0, 3));
          
          // Excelデータのフィールドをマッピング
          const mappedData = jsonData.map((row: any) => {
            console.log('処理中のExcel行:', row);
            
            // 会社DB形式かチェック
            if (row["会社メールアドレス"] !== undefined || row["社員番号"] !== undefined) {
              // 社内DB形式の場合、フィールドをマッピング
              // 所属階層1～5を連結して部署として使用
              const dept1 = row["所属階層１"] || 'その他';
              const dept2 = row["所属階層２"] || '';
              const dept3 = row["所属階層３"] || '';
              const dept4 = row["所属階層４"] || '';
              const dept5 = row["所属階層５"] || '';
              
              // 階層をスラッシュで連結（空の階層は除外）
              const departmentParts = [dept1, dept2, dept3, dept4, dept5].filter(d => d !== '');
              const departmentPath = departmentParts.join('/');
              
              // 職場氏名をユーザー名として使用、なければ氏名を使用
              return {
                email: row["会社メールアドレス"] || '',
                name: row["職場氏名"] || row["氏名"] || '',
                employeeId: String(row["社員番号"] || ''),
                department: departmentPath,
                // 6段階の組織階層情報を個別に保存（会社レベルを追加）
                organizationLevel1: "レバレジーズ株式会社", // 会社レベル
                organizationLevel2: row["所属階層１"] || null, // 本部レベル  
                organizationLevel3: row["所属階層２"] || null, // 部門レベル
                organizationLevel4: row["所属階層３"] || null, // グループレベル
                organizationLevel5: row["所属階層４"] || null, // チームレベル
                organizationLevel6: row["所属階層５"] || null, // ユニットレベル
              };
            } else {
              // 従来の形式の場合はそのまま
              return row;
            }
          });
          
          console.log('Excel マッピング後のデータ:', mappedData.slice(0, 3));
          
          // 必須フィールドのチェック
          const validData = mappedData.filter((row: any) => {
            const isValid = row.email && row.name && row.employeeId;
            if (!isValid) {
              console.log('無効なExcelデータ行:', row);
            }
            return isValid;
          }) as CsvEmployee[];
          
          console.log('有効なExcelデータ件数:', validData.length);
          
          setPreview(validData.slice(0, 10)); // 先頭10件をプレビュー表示
          setIsPreviewMode(true);
        } catch (error) {
          console.error('Excelファイルのパースエラー:', error);
          toast({
            title: 'エラー',
            description: 'Excelファイルの読み込みに失敗しました',
            variant: 'destructive',
          });
        }
      };
      
      reader.readAsBinaryString(selectedFile);
    } else {
      toast({
        title: 'エラー',
        description: 'CSVまたはExcel形式のファイルをアップロードしてください',
        variant: 'destructive',
      });
    }
  };

  // インポート処理
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) return null;

      const fileExt = file.name.split('.').pop()?.toLowerCase();

      // CSVまたはExcelに基づいて処理を分岐
      if (fileExt === 'csv' || fileExt === 'txt' || fileExt === 'tsv') {
        // CSVファイル処理
        return new Promise<ImportResult>((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              try {
                // データのマッピング
                const mappedData = results.data.map((row: any) => {
                  // 会社DBの形式かチェック
                  if (row["会社メールアドレス"] !== undefined || row["社員番号"] !== undefined) {
                    // 所属階層1～5を連結して部署として使用
                    const dept1 = row["所属階層１"] || 'その他';
                    const dept2 = row["所属階層２"] || '';
                    const dept3 = row["所属階層３"] || '';
                    const dept4 = row["所属階層４"] || '';
                    const dept5 = row["所属階層５"] || '';
                    
                    // 階層をスラッシュで連結（空の階層は除外）
                    const departmentParts = [dept1, dept2, dept3, dept4, dept5].filter(d => d !== '');
                    const departmentPath = departmentParts.join('/');
                    
                    return {
                      email: row["会社メールアドレス"] || '',
                      name: row["氏名"] || '',
                      employeeId: String(row["社員番号"] || ''),
                      displayName: row["職場氏名"] || '',
                      department: departmentPath
                    };
                  } else {
                    return row;
                  }
                });
                
                // 必須フィールドのチェック
                const validData = mappedData.filter((row: any) => 
                  row.email && row.name && row.employeeId
                ) as CsvEmployee[];

                console.log('インポート対象データ件数:', validData.length);
                
                try {
                  // APIリクエスト
                  const response = await importEmployeesData(validData);
                  
                  // 成功時のレスポンス処理
                  resolve(response as ImportResult);
                } catch (importError) {
                  console.error('インポート処理中のエラー:', importError);
                  resolve({
                    success: false,
                    newUsers: 0,
                    updatedUsers: 0,
                    errors: [(importError as Error).message || 'インポート処理中にエラーが発生しました']
                  });
                }
              } catch (error) {
                console.error('Import error:', error);
                resolve({
                  success: false,
                  newUsers: 0,
                  updatedUsers: 0,
                  errors: [(error as Error).message || '不明なエラーが発生しました']
                });
              }
            },
            error: (error) => {
              resolve({
                success: false,
                newUsers: 0,
                updatedUsers: 0,
                errors: [error.message || 'CSVファイルの解析に失敗しました']
              });
            }
          });
        });
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        // Excelファイル処理
        return new Promise<ImportResult>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const data = e.target?.result;
              if (!data) {
                resolve({
                  success: false,
                  newUsers: 0,
                  updatedUsers: 0,
                  errors: ['Excelファイルの読み込みに失敗しました']
                });
                return;
              }
              
              // Excelファイルを読み込み
              const workbook = XLSX.read(data, { type: 'binary' });
              
              // 最初のシートのデータを取得
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              
              // シートデータをJSONに変換
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
              
              // フィールドのマッピング（社内DB形式からアプリの形式へ）
              const mappedData = jsonData.map((row: any) => {
                // 会社DBの形式かチェック
                if (row["会社メールアドレス"] !== undefined || row["社員番号"] !== undefined) {
                  // 所属階層1～5を連結して部署として使用
                  const dept1 = row["所属階層１"] || 'その他';
                  const dept2 = row["所属階層２"] || '';
                  const dept3 = row["所属階層３"] || '';
                  const dept4 = row["所属階層４"] || '';
                  const dept5 = row["所属階層５"] || '';
                  
                  // 階層をスラッシュで連結（空の階層は除外）
                  const departmentParts = [dept1, dept2, dept3, dept4, dept5].filter(d => d !== '');
                  const departmentPath = departmentParts.join('/');
                  
                  // 職場氏名をユーザー名として使用、なければ氏名を使用
                  return {
                    email: row["会社メールアドレス"] || '',
                    name: row["職場氏名"] || row["氏名"] || '',
                    employeeId: String(row["社員番号"] || ''),
                    department: departmentPath
                  };
                } else {
                  return row;
                }
              });
              
              // 必須フィールドのチェック
              const validData = mappedData.filter((row: any) => 
                row.email && row.name && row.employeeId
              ) as CsvEmployee[];

              console.log('インポート対象Excelデータ件数:', validData.length);
              
              // APIリクエスト
              const response = await importEmployeesData(validData);
              
              resolve(response as ImportResult);
            } catch (error) {
              console.error('Excel import error:', error);
              resolve({
                success: false,
                newUsers: 0,
                updatedUsers: 0,
                errors: [(error as Error).message || 'Excelファイルの処理中にエラーが発生しました']
              });
            }
          };
          
          reader.onerror = () => {
            resolve({
              success: false,
              newUsers: 0,
              updatedUsers: 0,
              errors: ['Excelファイルの読み込み中にエラーが発生しました']
            });
          };
          
          reader.readAsBinaryString(file);
        });
      } else {
        return {
          success: false,
          newUsers: 0,
          updatedUsers: 0,
          errors: ['サポートされていないファイル形式です']
        };
      }
    },
    onSuccess: (data) => {
      if (data) {
        setImportResult(data);
        setIsPreviewMode(false);
        toast({
          title: data.success ? 'インポート完了' : 'インポート完了（警告あり）',
          description: `${data.newUsers}件新規追加、${data.updatedUsers}件更新しました。${data.errors.length > 0 ? `${data.errors.length}件のエラーが発生しました。` : ''}`,
          variant: data.success && data.errors.length === 0 ? 'default' : 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'インポートエラー',
        description: error.message || 'データのインポートに失敗しました',
        variant: 'destructive',
      });
    }
  });

  // ファイル選択のリセット
  const resetFileSelection = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // サンプルCSVのダウンロード
  const downloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // サンプルExcelのダウンロード
  const downloadSampleExcel = () => {
    // 社内DBの形式に合わせたサンプルデータの定義
    const sampleData = [
      { 
        "社員番号": 'E001', 
        "氏名": '田中太郎', 
        "職場氏名": 'タナカ', 
        "会社メールアドレス": 'tanaka@example.com', 
        "所属コード": 'S001',
        "所属階層１": '営業本部',
        "所属階層２": '第一営業部',
        "所属階層３": '',
        "所属階層４": '',
        "所属階層５": '',
        "勤務地コード": 'T01',
        "勤務地名": '東京本社',
        "職種コード": 'J01',
        "職種名": '営業',
        "雇用区分": '正社員',
        "入社日": '2020/04/01',
        "PLコード": 'PL001'
      },
      { 
        "社員番号": 'E002', 
        "氏名": '山田花子', 
        "職場氏名": 'ヤマダ', 
        "会社メールアドレス": 'yamada@example.com', 
        "所属部門": 'マーケティング部',
        "所属コード": 'M001',
        "所属階層１": '事業推進本部',
        "所属階層２": 'マーケティング部',
        "所属階層３": '',
        "所属階層４": '',
        "所属階層５": '',
        "勤務地コード": 'T01',
        "勤務地名": '東京本社',
        "職種コード": 'J02',
        "職種名": 'マーケティング',
        "雇用区分": '正社員',
        "入社日": '2019/10/01',
        "PLコード": 'PL002'
      },
      { 
        "社員番号": 'E003', 
        "氏名": '鈴木一郎', 
        "職場氏名": 'スズキ', 
        "会社メールアドレス": 'suzuki@example.com', 
        "所属部門": '開発部',
        "所属コード": 'D001',
        "所属階層１": '技術本部',
        "所属階層２": '開発部',
        "所属階層３": 'フロントエンド課',
        "所属階層４": '',
        "所属階層５": '',
        "勤務地コード": 'O01',
        "勤務地名": '大阪支社',
        "職種コード": 'J03',
        "職種名": 'エンジニア',
        "雇用区分": '正社員',
        "入社日": '2021/07/01',
        "PLコード": 'PL003'
      },
      { 
        "社員番号": 'E004', 
        "氏名": '佐藤太一', 
        "職場氏名": 'サトウ', 
        "会社メールアドレス": 'sato@example.com', 
        "所属部門": '', // 社長は部署なし
        "所属コード": 'EX001',
        "所属階層１": '役員',
        "所属階層２": '',
        "所属階層３": '',
        "所属階層４": '',
        "所属階層５": '',
        "勤務地コード": 'T01',
        "勤務地名": '東京本社',
        "職種コード": 'J10',
        "職種名": '役員',
        "雇用区分": '役員',
        "入社日": '2015/01/01',
        "PLコード": ''
      }
    ];

    // Excelファイルの作成
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "社員データ");
    
    // Excelファイルのダウンロード
    XLSX.writeFile(workbook, "employee_sample.xlsx");
  };

  // インポート完了画面の表示
  const renderImportResult = () => {
    if (!importResult) return null;

    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            {importResult.success ? 
              <CheckCircle2 className="text-green-500 mr-2" /> : 
              <AlertCircle className="text-amber-500 mr-2" />
            }
            インポート結果
          </CardTitle>
          <CardDescription>
            {importResult.success ? 
              'データのインポートが完了しました。' : 
              'データのインポートは完了しましたが、一部エラーがあります。'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl font-bold">{importResult.newUsers}</div>
                <div className="text-muted-foreground">新規追加</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl font-bold">{importResult.updatedUsers}</div>
                <div className="text-muted-foreground">更新</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1 text-destructive" />
                  エラー ({importResult.errors.length}件)
                </h4>
                <ul className="space-y-1 text-sm">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-destructive">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={resetFileSelection}
            className="w-full"
          >
            別のファイルをインポート
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // プレビュー画面の表示
  const renderPreview = () => {
    if (!file || preview.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{file.name}</span>
          <Badge variant="outline">{(file.size / 1024).toFixed(2)} KB</Badge>
        </div>

        <div className="rounded-md border">
          <div className="grid grid-cols-5 gap-2 p-4 font-medium border-b bg-muted">
            <div>社員番号</div>
            <div>氏名</div>
            <div>職場氏名</div>
            <div>メールアドレス</div>
            <div>所属部門</div>
          </div>
          <div className="divide-y">
            {preview.map((employee, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 p-4">
                <div>{employee.employeeId}</div>
                <div>{employee.name}</div>
                <div>{employee.displayName || '-'}</div>
                <div className="truncate">{employee.email}</div>
                <div>{employee.department || '-'}</div>
              </div>
            ))}
          </div>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>インポート前の確認</AlertTitle>
          <AlertDescription>
            上記の情報でインポートを実行します。全部で {preview.length} 件以上のデータがインポートされます。
          </AlertDescription>
        </Alert>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={resetFileSelection}
          >
            キャンセル
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? 'インポート中...' : 'インポート実行'}
          </Button>
        </div>

        {importMutation.isPending && (
          <div className="pt-4">
            <Progress value={30} className="h-2" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              データをインポート中です...
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // メイン画面の表示
  return (
    <div className="container py-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">従業員データインポート</h1>
      
      <div className="space-y-6">
        {!file && !importResult && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>CSVまたはExcelファイルをアップロード</CardTitle>
              <CardDescription>
                従業員データをインポートするためのCSVまたはExcelファイルをアップロードしてください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">ファイルアップロード</TabsTrigger>
                  <TabsTrigger value="template">テンプレート</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="p-4">
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="dropzone-file" 
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm font-semibold">
                          ここにファイルをドロップ、またはクリックしてアップロード
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CSVまたはExcel(.xlsx)ファイル
                        </p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </TabsContent>
                <TabsContent value="template" className="p-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      以下のテンプレートをダウンロードして、従業員データを入力してください。
                    </p>
                    <Separator />
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-muted p-2 rounded-md">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">CSVテンプレート</h4>
                          <p className="text-sm text-muted-foreground">
                            シンプルなCSV形式のテンプレートです。
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={downloadSampleCsv}
                            className="mt-2"
                          >
                            CSVテンプレートをダウンロード
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-start gap-4">
                        <div className="bg-muted p-2 rounded-md">
                          <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Excelテンプレート</h4>
                          <p className="text-sm text-muted-foreground">
                            Excel(.xlsx)形式のテンプレートです。
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={downloadSampleExcel}
                            className="mt-2"
                          >
                            Excelテンプレートをダウンロード
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        {/* プレビューまたはインポート結果の表示 */}
        {file && (
          <div className="mt-6">
            {isPreviewMode ? renderPreview() : renderImportResult()}
          </div>
        )}
      </div>
    </div>
  );
}