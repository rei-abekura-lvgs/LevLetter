import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building, Building2, Users, Upload, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrganizationHierarchy {
  id: number;
  level: number;
  name: string;
  code?: string;
  parentId?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const LEVEL_NAMES = {
  1: "会社",
  2: "本部",
  3: "部",
  4: "グループ",
  5: "チーム",
  6: "ユニット"
};

const LEVEL_COLORS = {
  1: "bg-red-100 text-red-800",
  2: "bg-orange-100 text-orange-800", 
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-green-100 text-green-800",
  5: "bg-blue-100 text-blue-800",
  6: "bg-purple-100 text-purple-800"
};

interface OrganizationFormData {
  level: number;
  name: string;
  code: string;
  parentId?: number;
  description: string;
  isActive: boolean;
}

export default function OrganizationManagement() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [editingOrg, setEditingOrg] = useState<OrganizationHierarchy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [formData, setFormData] = useState<OrganizationFormData>({
    level: 1,
    name: "",
    code: "",
    parentId: undefined,
    description: "",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 組織データを取得
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["/api/admin/organizations"],
    retry: false,
  });

  // 組織作成・更新
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/organizations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      resetForm();
      toast({ title: "組織を作成しました" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/admin/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      resetForm();
      toast({ title: "組織を更新しました" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "組織を削除しました" });
    }
  });

  // 一括インポート
  const importMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/organizations/import", data),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setImportData("");
      toast({ 
        title: "インポート完了",
        description: `新規作成: ${result.imported}件, 更新: ${result.updated}件`
      });
    }
  });

  const resetForm = () => {
    setFormData({
      level: 1,
      name: "",
      code: "",
      parentId: undefined,
      description: "",
      isActive: true
    });
    setEditingOrg(null);
    setIsFormOpen(false);
  };

  const handleEdit = (org: OrganizationHierarchy) => {
    setEditingOrg(org);
    setFormData({
      level: org.level,
      name: org.name,
      code: org.code || "",
      parentId: org.parentId,
      description: org.description || "",
      isActive: org.isActive
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "エラー", description: "名前は必須です", variant: "destructive" });
      return;
    }

    const submitData = {
      ...formData,
      code: formData.code.trim() || null,
      description: formData.description.trim() || null,
      parentId: formData.parentId || null
    };

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleImport = () => {
    try {
      const parsedData = JSON.parse(importData);
      if (!Array.isArray(parsedData)) {
        throw new Error("データは配列形式である必要があります");
      }
      
      importMutation.mutate({ organizations: parsedData });
    } catch (error) {
      toast({ 
        title: "インポートエラー", 
        description: "有効なJSON配列を入力してください",
        variant: "destructive" 
      });
    }
  };

  // レベル別にフィルタリング
  const filteredOrganizations = organizations.filter((org: OrganizationHierarchy) => 
    selectedLevel === 0 || org.level === selectedLevel
  );

  // 階層ツリー構造を作成
  const buildHierarchy = (orgs: OrganizationHierarchy[], parentId: number | null = null): any[] => {
    return orgs
      .filter(org => org.parentId === parentId)
      .map(org => ({
        ...org,
        children: buildHierarchy(orgs, org.id)
      }));
  };

  const hierarchyTree = buildHierarchy(organizations);

  const renderHierarchyItem = (org: any, depth = 0) => (
    <div key={org.id} className="mb-2">
      <div 
        className={`flex items-center justify-between p-3 border rounded-lg ${
          !org.isActive ? 'bg-gray-50 opacity-60' : 'bg-white'
        }`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="flex items-center gap-3">
          <Badge className={LEVEL_COLORS[org.level as keyof typeof LEVEL_COLORS]}>
            Lv{org.level} {LEVEL_NAMES[org.level as keyof typeof LEVEL_NAMES]}
          </Badge>
          <div>
            <h3 className="font-medium">{org.name}</h3>
            {org.code && <p className="text-sm text-gray-500">コード: {org.code}</p>}
            {org.description && <p className="text-sm text-gray-600 mt-1">{org.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!org.isActive && <Badge variant="secondary">無効</Badge>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(org)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteMutation.mutate(org.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {org.children?.map((child: any) => renderHierarchyItem(child, depth + 1))}
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">読み込み中...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            5階層ピラミッド型組織管理
          </h1>
          <p className="text-gray-600 mt-1">
            本部 &gt; 部 &gt; グループ &gt; チーム &gt; ユニットの5階層組織構造を管理
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      <Tabs defaultValue="hierarchy" className="w-full">
        <TabsList>
          <TabsTrigger value="hierarchy">階層ビュー</TabsTrigger>
          <TabsTrigger value="level">レベル別</TabsTrigger>
          <TabsTrigger value="import">一括インポート</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                組織階層ツリー
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hierarchyTree.length > 0 ? (
                <div className="space-y-2">
                  {hierarchyTree.map(org => renderHierarchyItem(org))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>組織データがありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="level" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Label>レベル表示:</Label>
            <Select value={selectedLevel.toString()} onValueChange={(v) => setSelectedLevel(parseInt(v))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">すべて</SelectItem>
                {Object.entries(LEVEL_NAMES).map(([level, name]) => (
                  <SelectItem key={level} value={level}>
                    Lv{level} {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredOrganizations.map((org: OrganizationHierarchy) => (
              <Card key={org.id} className={!org.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={LEVEL_COLORS[org.level as keyof typeof LEVEL_COLORS]}>
                        Lv{org.level} {LEVEL_NAMES[org.level as keyof typeof LEVEL_NAMES]}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{org.name}</h3>
                        {org.code && <p className="text-sm text-gray-500">コード: {org.code}</p>}
                        {org.description && <p className="text-sm text-gray-600 mt-1">{org.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!org.isActive && <Badge variant="secondary">無効</Badge>}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(org)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(org.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                組織一括インポート
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>JSON形式データ</Label>
                <Textarea
                  placeholder={`[
  {
    "level": 1,
    "name": "経営本部",
    "code": "MGT",
    "description": "経営管理部門"
  },
  {
    "level": 2,
    "name": "人事部",
    "code": "HR",
    "parentId": 1,
    "description": "人事管理部門"
  }
]`}
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  level(1-5必須), name(必須), code, parentId, description, isActive が設定可能です
                </p>
              </div>
              <Button 
                onClick={handleImport}
                disabled={!importData.trim() || importMutation.isPending}
              >
                {importMutation.isPending ? "インポート中..." : "インポート実行"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 組織作成・編集フォーム */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {editingOrg ? "組織編集" : "新規組織作成"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>レベル *</Label>
                  <Select 
                    value={formData.level.toString()} 
                    onValueChange={(v) => setFormData({...formData, level: parseInt(v)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEVEL_NAMES).map(([level, name]) => (
                        <SelectItem key={level} value={level}>
                          Lv{level} {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>名前 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>コード</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>親組織</Label>
                  <Select 
                    value={formData.parentId?.toString() || ""} 
                    onValueChange={(v) => setFormData({...formData, parentId: v ? parseInt(v) : undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="親組織を選択（任意）" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations
                        .filter((org: OrganizationHierarchy) => org.level < formData.level)
                        .map((org: OrganizationHierarchy) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            Lv{org.level} {org.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>説明</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label>有効</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    キャンセル
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingOrg ? "更新" : "作成"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}