import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Heart, MessageCircle, TrendingUp, Users, Award } from "lucide-react";

interface UserInfo {
  id: number;
  name: string;
  displayName: string | null;
  department: string | null;
  avatarColor: string;
  customAvatarUrl: string | null;
}

interface PersonalInteraction {
  user: UserInfo;
  count: number;
  rank: number;
}

interface DashboardStats {
  monthly: {
    pointConversionRate: number;
    userCardRank: number;
    userLikeRank: number;
  };
  personal: {
    sentCards: PersonalInteraction[];
    receivedCards: PersonalInteraction[];
    sentLikes: PersonalInteraction[];
    receivedLikes: PersonalInteraction[];
  };
}

// デモデータ生成関数
const generateDemoData = (): DashboardStats => {
  const demoUsers: UserInfo[] = [
    { id: 1, name: "田中太郎", displayName: "田中太郎", department: "営業部", avatarColor: "#FF6B6B", customAvatarUrl: null },
    { id: 2, name: "佐藤花子", displayName: "佐藤花子", department: "開発部", avatarColor: "#4ECDC4", customAvatarUrl: null },
    { id: 3, name: "鈴木一郎", displayName: "鈴木一郎", department: "マーケティング部", avatarColor: "#45B7D1", customAvatarUrl: null },
    { id: 4, name: "高橋美咲", displayName: "高橋美咲", department: "人事部", avatarColor: "#96CEB4", customAvatarUrl: null },
    { id: 5, name: "山田健太", displayName: "山田健太", department: "企画部", avatarColor: "#FFEAA7", customAvatarUrl: null },
    { id: 6, name: "渡辺真理", displayName: "渡辺真理", department: "総務部", avatarColor: "#DDA0DD", customAvatarUrl: null },
    { id: 7, name: "中村大輔", displayName: "中村大輔", department: "開発部", avatarColor: "#98D8C8", customAvatarUrl: null },
    { id: 8, name: "小林由美", displayName: "小林由美", department: "営業部", avatarColor: "#F7DC6F", customAvatarUrl: null },
    { id: 9, name: "加藤洋介", displayName: "加藤洋介", department: "マーケティング部", avatarColor: "#BB8FCE", customAvatarUrl: null },
    { id: 10, name: "藤田綾香", displayName: "藤田綾香", department: "人事部", avatarColor: "#85C1E9", customAvatarUrl: null }
  ];

  return {
    monthly: {
      pointConversionRate: 85.2,
      userCardRank: 12,
      userLikeRank: 8
    },
    personal: {
      sentCards: demoUsers.slice(0, 10).map((user, index) => ({
        user,
        count: Math.floor(Math.random() * 20) + 5,
        rank: index + 1
      })),
      receivedCards: demoUsers.slice(2, 10).map((user, index) => ({
        user,
        count: Math.floor(Math.random() * 15) + 3,
        rank: index + 1
      })),
      sentLikes: demoUsers.slice(1, 9).map((user, index) => ({
        user,
        count: Math.floor(Math.random() * 30) + 10,
        rank: index + 1
      })),
      receivedLikes: demoUsers.slice(3, 10).map((user, index) => ({
        user,
        count: Math.floor(Math.random() * 25) + 8,
        rank: index + 1
      }))
    }
  };
};

export default function Dashboard() {
  const { data: stats = generateDemoData(), isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  const formatDate = (date: Date) => `${date.getMonth() + 1}月${date.getDate()}日`;

  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const periodText = `${formatDate(oneMonthAgo)}〜${formatDate(now)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">データの読み込みに失敗しました</h2>
            <p className="text-gray-500 mb-4">しばらく時間をおいて再度お試しください</p>
            <Button onClick={() => window.location.reload()}>再読み込み</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
          <p className="text-gray-600">期間: {periodText}</p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>ポイント情報について:</strong> 最新のポイント残高や統計データが反映されていない場合は、ブラウザを更新してください。
            </p>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ポイント変換率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthly.pointConversionRate}%</div>
              <p className="text-xs text-muted-foreground">前月比 +5.2%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">カード送信ランク</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthly.userCardRank}位</div>
              <p className="text-xs text-muted-foreground">全社{stats.monthly.userCardRank}位</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">いいね送信ランク</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthly.userLikeRank}位</div>
              <p className="text-xs text-muted-foreground">全社{stats.monthly.userLikeRank}位</p>
            </CardContent>
          </Card>
        </div>

        {/* カードランキング */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">カードランキング</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <ArrowUp className="h-5 w-5 text-[#3990EA]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">カード送信先TOP10</h3>
                    <p className="text-sm text-gray-500">よく送信している相手</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {stats.personal.sentCards && stats.personal.sentCards.length > 0 ? (
                  <div className="space-y-4">
                    {stats.personal.sentCards.slice(0, 10).map((item, index) => (
                      <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-[#3990EA] text-white rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.user.displayName || item.user.name}</p>
                            <p className="text-sm text-gray-500">{item.user.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#3990EA]">{item.count}回</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">まだカードを送信していません</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <ArrowDown className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">カード受信元TOP10</h3>
                    <p className="text-sm text-gray-500">よくもらう相手</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {stats.personal.receivedCards && stats.personal.receivedCards.length > 0 ? (
                  <div className="space-y-4">
                    {stats.personal.receivedCards.slice(0, 10).map((item, index) => (
                      <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.user.displayName || item.user.name}</p>
                            <p className="text-sm text-gray-500">{item.user.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{item.count}回</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">まだカードを受信していません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* いいねランキング */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">いいねランキング</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <ArrowUp className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">いいね送信先TOP10</h3>
                    <p className="text-sm text-gray-500">よくいいねしている相手</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {stats.personal.sentLikes && stats.personal.sentLikes.length > 0 ? (
                  <div className="space-y-4">
                    {stats.personal.sentLikes.slice(0, 10).map((item, index) => (
                      <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.user.displayName || item.user.name}</p>
                            <p className="text-sm text-gray-500">{item.user.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{item.count}回</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">まだいいねを送信していません</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <ArrowDown className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">いいね受信元TOP10</h3>
                    <p className="text-sm text-gray-500">よくいいねをもらう相手</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {stats.personal.receivedLikes && stats.personal.receivedLikes.length > 0 ? (
                  <div className="space-y-4">
                    {stats.personal.receivedLikes.slice(0, 10).map((item, index) => (
                      <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.user.displayName || item.user.name}</p>
                            <p className="text-sm text-gray-500">{item.user.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{item.count}回</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">まだいいねを受信していません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}