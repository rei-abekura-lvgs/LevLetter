import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { UploadCloud, AlertCircle, FileText, CheckCircle, X, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// 従業員データの型定義
interface EmployeeData {
  employeeId: string;
  name: string;
  displayName: string;
  email: string;
  department: string;
  departmentCode: string;
  position?: string;
}

// インポート結果の型定義
interface ImportResult {
  success: boolean;
  newUsers: number;
  updatedUsers: number;
  errors: string[];
}

export default function EmployeeImport() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState("");
  const [previewData, setPreviewData] = useState<EmployeeData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importStep, setImportStep] = useState<"input" | "preview" | "result">("input");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // CSVデータのパース
  const parseCSVData = () => {
    try {
      // 入力テキストを行に分割
      const lines = csvData.trim().split('\n');
      if (lines.length <= 1) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "データが少なすぎます。適切なCSVデータを入力してください。",
        });
        return;
      }

      // ヘッダー行を取得
      const headers = lines[0].split(',').map(header => header.trim());
      const expectedHeaders = ['社員番号', '氏名', '職場氏名', '会社メールアドレス', '所属部門', '所属コード'];
      
      // ヘッダー検証
      const missingHeaders = expectedHeaders.filter(header => 
        !headers.some(h => h.includes(header))
      );
      
      if (missingHeaders.length > 0) {
        toast({
          variant: "destructive",
          title: "ヘッダーエラー",
          description: `必要なヘッダーが見つかりません: ${missingHeaders.join(', ')}`,
        });
        return;
      }

      // ヘッダーのインデックスを特定
      const employeeIdIndex = headers.findIndex(h => h.includes('社員番号'));
      const nameIndex = headers.findIndex(h => h.includes('氏名'));
      const displayNameIndex = headers.findIndex(h => h.includes('職場氏名'));
      const emailIndex = headers.findIndex(h => h.includes('会社メールアドレス'));
      const departmentIndex = headers.findIndex(h => h.includes('所属部門'));
      const departmentCodeIndex = headers.findIndex(h => h.includes('所属コード'));
      
      // データ行を処理
      const parsedData: EmployeeData[] = [];
      for (let i = 1; i < lines.length; i++) {
        // 空行をスキップ
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(val => val.trim());
        if (values.length < 6) continue; // 不完全な行をスキップ
        
        const employee: EmployeeData = {
          employeeId: values[employeeIdIndex],
          name: values[nameIndex],
          displayName: values[displayNameIndex],
          email: values[emailIndex],
          department: values[departmentIndex],
          departmentCode: values[departmentCodeIndex],
          position: values[headers.findIndex(h => h.includes('職種'))] || undefined
        };
        
        parsedData.push(employee);
      }
      
      if (parsedData.length === 0) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "有効なデータが見つかりませんでした。",
        });
        return;
      }
      
      setPreviewData(parsedData);
      setImportStep("preview");
      setShowPreview(true);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "パースエラー",
        description: "データの解析中にエラーが発生しました。CSV形式を確認してください。",
      });
    }
  };

  // 従業員データのインポート処理
  const importEmployees = useMutation({
    mutationFn: async (data: EmployeeData[]) => {
      const response = await fetch("/api/admin/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: data }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "データのインポートに失敗しました");
      }
      
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      setImportStep("result");
      toast({
        title: "インポート完了",
        description: `${data.newUsers}件の新規ユーザーと${data.updatedUsers}件の更新を完了しました。`,
      });
      
      // 関連データを更新
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "インポートエラー",
        description: error.message,
      });
    },
  });

  // インポート実行
  const handleImport = () => {
    importEmployees.mutate(previewData);
  };

  // インポート処理のリセット
  const resetImport = () => {
    setCsvData("");
    setPreviewData([]);
    setShowPreview(false);
    setImportStep("input");
    setImportResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>従業員データインポート</CardTitle>
        <CardDescription>CSVデータを使用して従業員情報を一括登録・更新します</CardDescription>
      </CardHeader>
      
      <CardContent>
        {importStep === "input" && (
          <>
            <Alert className="mb-6">
              <FileText className="h-4 w-4" />
              <AlertTitle>CSVデータ形式</AlertTitle>
              <AlertDescription>
                人事システムからエクスポートしたCSVファイルを貼り付けてください。<br />
                必須項目: 社員番号、氏名、職場氏名、会社メールアドレス、所属部門、所属コード
              </AlertDescription>
            </Alert>
            
            <Textarea
              placeholder="CSVデータを貼り付けてください..."
              className="min-h-[300px] font-mono text-sm"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
            />
            
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="format">
                <AccordionTrigger>CSVフォーマット例</AccordionTrigger>
                <AccordionContent>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                    社員番号,氏名,職場氏名,会社メールアドレス,所属部門,所属コード,所属階層１,所属階層２,所属階層３,所属階層４,所属階層５,勤務地コード,勤務地名,職種コード,職種名<br />
                    326901,阿部倉　怜,阿部倉　怜,rei.abekura@leverages.jp,SY,SY1000000000,システム本部,メディアシステム部,,,,67,渋谷一丁目支店2階,2,内勤開発
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
        
        {importStep === "preview" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">データプレビュー</h3>
              <Badge variant="outline" className="text-sm">
                {previewData.length}件のデータ
              </Badge>
            </div>
            
            <div className="rounded-md border overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>社員番号</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>部署コード</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((employee, index) => (
                    <TableRow key={index}>
                      <TableCell>{employee.employeeId}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.departmentCode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <Alert className="mt-6">
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>インポート前の確認</AlertTitle>
              <AlertDescription>
                上記のデータをインポートします。既存ユーザーは更新され、新規ユーザーが作成されます。<br />
                ・メールアドレスが一致するユーザーは情報が更新されます<br />
                ・存在しない部署は自動的に作成されます<br />
                ・パスワードは設定されません（ユーザーが初回ログイン時に設定）
              </AlertDescription>
            </Alert>
          </>
        )}
        
        {importStep === "result" && importResult && (
          <>
            <div className="mb-6 text-center">
              {importResult.success ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">インポート成功</h3>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-red-100 p-3">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold">一部エラーが発生しました</h3>
                </div>
              )}
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl">{previewData.length}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">処理対象レコード</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl text-green-600">{importResult.newUsers}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">新規作成ユーザー</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl text-blue-600">{importResult.updatedUsers}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">更新ユーザー</CardContent>
              </Card>
            </div>
            
            {importResult.errors.length > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラーが発生したレコード</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="justify-between">
        {importStep === "input" && (
          <Button 
            className="ml-auto" 
            onClick={parseCSVData} 
            disabled={!csvData.trim()}
          >
            <FileText className="mr-2 h-4 w-4" /> データをプレビュー
          </Button>
        )}
        
        {importStep === "preview" && (
          <>
            <Button variant="outline" onClick={resetImport}>
              <X className="mr-2 h-4 w-4" /> キャンセル
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importEmployees.isPending || previewData.length === 0}
            >
              {importEmployees.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              インポートを実行
            </Button>
          </>
        )}
        
        {importStep === "result" && (
          <Button onClick={resetImport} className="ml-auto">
            新しいインポートを開始
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}