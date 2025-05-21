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
  // その他のフィールドは必要に応じて追加
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
    return await apiRequest<ImportResult>("POST", "/api/admin/employees/import", {
      employees: employees
    });
  } catch (error) {
    console.error('インポートAPI呼び出しエラー:', error);
    throw error;
  }
}

const SAMPLE_CSV = `社員番号,氏名,職場氏名,会社メールアドレス,所属部門,所属コード,所属階層１,所属階層２,所属階層３,所属階層４,所属階層５,勤務地コード,勤務地名,職種コード,職種名,雇用区分,入社日,PLコード
E001,田中太郎,タナカ,tanaka@example.com,営業部,S001,営業本部,第一営業部,,,,T01,東京本社,J01,営業,正社員,2020/04/01,PL001
E002,山田花子,ヤマダ,yamada@example.com,マーケティング部,M001,事業推進本部,マーケティング部,,,,T01,東京本社,J02,マーケティング,正社員,2019/10/01,PL002
E003,鈴木一郎,スズキ,suzuki@example.com,開発部,D001,技術本部,開発部,フロントエンド課,,,O01,大阪支社,J03,エンジニア,正社員,2021/07/01,PL003
E004,佐藤太一,サトウ,sato@example.com,,EX001,役員,,,,,T01,東京本社,J10,役員,役員,2015/01/01,`;

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
              console.log('プロパティ一覧:', Object.keys(results.data[0]));
            }
            
            // CSV/TSVパースデータのフィールドをマッピング
            const mappedData = results.data.map((row: any) => {
              console.log('処理中の行:', row);
            
              // 会社DBの形式かチェック（TSVと思われる場合）
              if (row["会社メールアドレス"] !== undefined || row["社員番号"] !== undefined) {
                // 社内DB形式の場合、フィールドをマッピング
                return {
                  email: row["会社メールアドレス"] || '',
                  name: row["氏名"] || '',
                  employeeId: row["社員番号"] || '',
                  displayName: row["職場氏名"] || '',
                  department: row["所属部門"] || ''
                };
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
              return {
                email: row["会社メールアドレス"] || '',
                name: row["氏名"] || '',
                employeeId: String(row["社員番号"] || ''), // 数値の場合を考慮して文字列に変換
                displayName: row["職場氏名"] || '',
                department: row["所属部門"] || ''
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
      if (fileExt === 'csv') {
        // CSVファイル処理
        return new Promise<ImportResult>((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              try {
                // 必須フィールドのチェック
                const validData = results.data.filter((row: any) => 
                  row.email && row.name && row.employeeId
                ) as CsvEmployee[];

                // APIリクエスト
                const response = await importEmployeesData(validData);
                
                resolve(response as ImportResult);
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
                return {
                  email: row["会社メールアドレス"],
                  name: row["氏名"],
                  employeeId: row["社員番号"],
                  displayName: row["職場氏名"],
                  department: row["所属部門"]
                };
              });
              
              // 必須フィールドのチェック
              const validData = mappedData.filter((row: any) => 
                row.email && row.name && row.employeeId
              ) as CsvEmployee[];

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
        "所属部門": '営業部',
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
    
    // ワークブックの作成
    const wb = XLSX.utils.book_new();
    
    // データをシートに変換
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // シートをワークブックに追加
    XLSX.utils.book_append_sheet(wb, ws, "従業員データ");
    
    // Excelファイルとしてダウンロード
    XLSX.writeFile(wb, "employee_sample.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>従業員データインポート</CardTitle>
        <CardDescription>
          CSVまたはExcelファイルから従業員データを一括登録・更新します。
          新規ユーザーはランダムパスワードで作成され、既存ユーザーは情報が更新されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList>
            <TabsTrigger value="upload">データアップロード</TabsTrigger>
            <TabsTrigger value="help">使い方ガイド</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-500">
                      <span className="font-semibold">ファイルをクリックして選択</span>
                      またはドラッグ＆ドロップ
                    </p>
                    <p className="text-xs text-gray-400">
                      CSVまたはExcelファイル (.csv, .xlsx, .xls)
                    </p>
                  </div>
                </label>
              </div>
              
              <div className="w-48">
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={downloadSampleCsv}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    サンプルCSV
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={downloadSampleExcel}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    サンプルExcel
                  </Button>
                </div>
              </div>
            </div>

            {file && (
              <div className="p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-medium">選択したファイル</h3>
                    <p className="text-xs text-gray-500">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFileSelection}
                    >
                      リセット
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => importMutation.mutate()}
                      disabled={importMutation.isPending}
                    >
                      {importMutation.isPending ? 'インポート中...' : 'インポート実行'}
                    </Button>
                  </div>
                </div>

                {isPreviewMode && preview.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">データプレビュー（最初の10件）</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 border text-left">メールアドレス</th>
                            <th className="p-2 border text-left">名前</th>
                            <th className="p-2 border text-left">従業員ID</th>
                            <th className="p-2 border text-left">表示名</th>
                            <th className="p-2 border text-left">部署</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-2 border">{row.email}</td>
                              <td className="p-2 border">{row.name}</td>
                              <td className="p-2 border">{row.employeeId}</td>
                              <td className="p-2 border">{row.displayName || '-'}</td>
                              <td className="p-2 border">{row.department || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importResult && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium">インポート結果</h4>
                    
                    <div className="flex gap-4">
                      <div className="p-3 bg-white rounded border flex-1 text-center">
                        <p className="text-xs text-gray-500 mb-1">新規ユーザー</p>
                        <p className="text-lg font-semibold text-green-600">{importResult.newUsers}</p>
                      </div>
                      <div className="p-3 bg-white rounded border flex-1 text-center">
                        <p className="text-xs text-gray-500 mb-1">更新ユーザー</p>
                        <p className="text-lg font-semibold text-blue-600">{importResult.updatedUsers}</p>
                      </div>
                      <div className="p-3 bg-white rounded border flex-1 text-center">
                        <p className="text-xs text-gray-500 mb-1">エラー</p>
                        <p className="text-lg font-semibold text-red-500">{importResult.errors.length}</p>
                      </div>
                    </div>
                    
                    {importResult.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>エラーが発生しました</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 mt-2 text-sm">
                            {importResult.errors.slice(0, 5).map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>...他 {importResult.errors.length - 5} 件のエラー</li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="help">
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>CSVファイルの形式について</AlertTitle>
                <AlertDescription>
                  CSVファイルは以下のフィールドを含む必要があります。
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <Badge variant="secondary">必須</Badge>
                      <p className="text-sm mt-1">email - メールアドレス</p>
                    </div>
                    <div>
                      <Badge variant="secondary">必須</Badge>
                      <p className="text-sm mt-1">name - 氏名</p>
                    </div>
                    <div>
                      <Badge variant="secondary">必須</Badge>
                      <p className="text-sm mt-1">employeeId - 従業員ID</p>
                    </div>
                    <div>
                      <Badge variant="outline">任意</Badge>
                      <p className="text-sm mt-1">displayName - 表示名</p>
                    </div>
                    <div>
                      <Badge variant="outline">任意</Badge>
                      <p className="text-sm mt-1">department - 部署名</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-emerald-50 border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertTitle>インポート処理について</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>メールアドレスが既存ユーザーと一致する場合は情報が更新されます</li>
                    <li>新規ユーザーはランダムパスワードで作成されます</li>
                    <li>存在しない部署名が指定された場合は自動的に作成されます</li>
                    <li>データに不備がある行はスキップされます</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-gray-500">
          アップロードするCSVファイルには機密情報が含まれる場合があります。
          ファイルの内容は安全に処理され、必要なデータのみがデータベースに保存されます。
        </p>
      </CardFooter>
    </Card>
  );
}