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
import { importEmployees, ImportResult, ImportEmployeesRequest } from "@/lib/api";

// 既にAPI.tsで定義されているのでコメントアウト
// interface ImportResult {
//   success: boolean;
//   newUsers: number;
//   updatedUsers: number;
//   errors: string[];
// }

interface CsvEmployee {
  email: string;
  name: string;
  employeeId: string;
  displayName?: string;
  department?: string;
}

const SAMPLE_CSV = `email,name,employeeId,displayName,department
tanaka@example.com,田中太郎,E001,タナカ,営業部
yamada@example.com,山田花子,E002,ヤマダ,マーケティング部
suzuki@example.com,鈴木一郎,E003,スズキ,開発部`;

export default function EmployeeImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvEmployee[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルのパース（CSVまたはExcel）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    
    // ファイル形式に応じてパース処理を分岐
    if (fileExt === 'csv') {
      // CSVファイルのパース
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // 必須フィールドのチェック
          const validData = results.data.filter((row: any) => 
            row.email && row.name && row.employeeId
          ) as CsvEmployee[];
          
          setPreview(validData.slice(0, 10)); // 先頭10件をプレビュー表示
          setIsPreviewMode(true);
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
          
          // 必須フィールドのチェック
          const validData = jsonData.filter((row: any) => 
            row.email && row.name && row.employeeId
          ) as CsvEmployee[];
          
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
                const response = await importEmployees({ employees: validData });
                
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
              
              // 必須フィールドのチェック
              const validData = jsonData.filter((row: any) => 
                row.email && row.name && row.employeeId
              ) as CsvEmployee[];

              // APIリクエスト
              const response = await apiRequest<ImportResult>(
                'POST',
                '/api/admin/employees/import', 
                { employees: validData }
              );
              
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
    // サンプルデータの定義
    const sampleData = [
      { email: 'tanaka@example.com', name: '田中太郎', employeeId: 'E001', displayName: 'タナカ', department: '営業部' },
      { email: 'yamada@example.com', name: '山田花子', employeeId: 'E002', displayName: 'ヤマダ', department: 'マーケティング部' },
      { email: 'suzuki@example.com', name: '鈴木一郎', employeeId: 'E003', displayName: 'スズキ', department: '開発部' }
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