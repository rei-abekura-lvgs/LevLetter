import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, MessageSquare, TrendingUp, Users } from "lucide-react";

interface DashboardStats {
  weekly: {
    currentPoints: number;
    maxPoints: number;
    usedPoints: number;
  };
  monthly: {
    received: {
      points: number;
      cards: number;
      likes: number;
    };
    sent: {
      points: number;
      cards: number;
      likes: number;
    };
  };
  lifetime: {
    received: {
      points: number;
      cards: number;
      likes: number;
    };
    sent: {
      points: number;
      cards: number;
      likes: number;
    };
  };
  rankings: {
    cardSentTo: Array<{ user: any; count: number }>;
    cardReceivedFrom: Array<{ user: any; count: number }>;
    likeSentTo: Array<{ user: any; count: number }>;
    likeReceivedFrom: Array<{ user: any; count: number }>;
  };
}

export default function DashboardNew() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          ダッシュボードデータを読み込めませんでした
        </div>
      </div>
    );
  }

  // 今週の期間を計算
  const getWeekPeriod = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (date: Date) => `${date.getMonth() + 1}月${date.getDate()}日`;
    return `${formatDate(monday)}〜${formatDate(sunday)}`;
  };

  // 今月の期間を計算
  const getMonthPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
      </div>

      {/* 今週のポイント */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-5 w-5" />
            今週のポイント（{getWeekPeriod()}）
          </CardTitle>
          <CardDescription className="text-blue-700">
            毎週月曜日に500ptが支給されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900">
            {stats.weekly.currentPoints}pt / {stats.weekly.maxPoints}pt
          </div>
          <div className="text-sm text-blue-600 mt-2">
            使用済み: {stats.weekly.usedPoints}pt
          </div>
        </CardContent>
      </Card>

      {/* 今月のまとめ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {getMonthPeriod()}のまとめ
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 今月もらった */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">今月もらった</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  ポイント
                </span>
                <span className="font-semibold">{stats.monthly.received.points}pt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  カード
                </span>
                <span className="font-semibold">{stats.monthly.received.cards}枚</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-600" />
                  いいね
                </span>
                <span className="font-semibold">{stats.monthly.received.likes}回</span>
              </div>
            </CardContent>
          </Card>

          {/* 今月あげた */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">今月あげた</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  ポイント
                </span>
                <span className="font-semibold">{stats.monthly.sent.points}pt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  カード
                </span>
                <span className="font-semibold">{stats.monthly.sent.cards}枚</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-blue-600" />
                  いいね
                </span>
                <span className="font-semibold">{stats.monthly.sent.likes}回</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 全期間の累計 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          全期間の累計
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 累計もらった */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">累計もらった</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  ポイント
                </span>
                <span className="font-semibold">{stats.lifetime.received.points}pt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  カード
                </span>
                <span className="font-semibold">{stats.lifetime.received.cards}枚</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-600" />
                  いいね
                </span>
                <span className="font-semibold">{stats.lifetime.received.likes}回</span>
              </div>
            </CardContent>
          </Card>

          {/* 累計あげた */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">累計あげた</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  ポイント
                </span>
                <span className="font-semibold">{stats.lifetime.sent.points}pt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  カード
                </span>
                <span className="font-semibold">{stats.lifetime.sent.cards}枚</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-blue-600" />
                  いいね
                </span>
                <span className="font-semibold">{stats.lifetime.sent.likes}回</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TOP10ランキング */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          私のTOP10
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* カード送信先TOP10 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-700">カード送信先TOP10</CardTitle>
              <CardDescription>
                最も多くカードを送った相手
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.rankings.cardSentTo.length > 0 ? (
                <div className="space-y-2">
                  {stats.rankings.cardSentTo.slice(0, 10).map((item, index) => (
                    <div key={item.user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{item.user.displayName || item.user.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.count}枚</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  まだカードを送信していません
                </div>
              )}
            </CardContent>
          </Card>

          {/* カード受信元TOP10 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-700">カード受信元TOP10</CardTitle>
              <CardDescription>
                最も多くカードをくれた相手
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.rankings.cardReceivedFrom.length > 0 ? (
                <div className="space-y-2">
                  {stats.rankings.cardReceivedFrom.slice(0, 10).map((item, index) => (
                    <div key={item.user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{item.user.displayName || item.user.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.count}枚</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  まだカードを受信していません
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}