import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Heart, MessageSquare, Users, Award, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    pointConsumptionRate: number;
    cardRank: number;
    likeRank: number;
    totalUsers: number;
  };
  personal: {
    sentCards: PersonalInteraction[];
    receivedCards: PersonalInteraction[];
    sentLikes: PersonalInteraction[];
    receivedLikes: PersonalInteraction[];
  };
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const getMonthDateRange = () => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    return `${oneMonthAgo.getFullYear()}年${oneMonthAgo.getMonth() + 1}月${oneMonthAgo.getDate()}日 - ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  };

  const renderPersonalRanking = (items: PersonalInteraction[], title: string, icon: React.ReactNode, emptyMessage: string) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
            <Badge variant="outline">上位30位</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.length > 0 ? (
              items.map((item, index) => (
                <div key={item.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index < 3 ? (
                        <Trophy className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {item.user.customAvatarUrl ? (
                        <img
                          src={item.user.customAvatarUrl}
                          alt={item.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-${item.user.avatarColor}`}>
                          {item.user.name.charAt(0)}
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.user.displayName || item.user.name}</h4>
                        <p className="text-sm text-gray-500">{item.user.department}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-700">{item.count}</div>
                    <div className="text-xs text-gray-500">回</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {emptyMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <p className="text-gray-500">ダッシュボードデータを読み込めませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <span>ダッシュボード</span>
            </h1>
            <p className="text-gray-600 mt-1">あなたのアクティビティサマリー</p>
          </div>
        </div>

        {/* 最近1ヶ月のデータ */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">最近1ヶ月のデータ</h2>
            <Badge variant="outline">{getMonthDateRange()}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ポイント消費率 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Award className="h-5 w-5 text-purple-500" />
                  <span>ポイント消費率</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">消費率</span>
                    <span className="text-2xl font-bold text-purple-600">{stats.monthly.pointConsumptionRate}%</span>
                  </div>
                  <Progress value={stats.monthly.pointConsumptionRate} className="h-2" />
                  <p className="text-xs text-gray-500">週間500ptに対する消費率</p>
                </div>
              </CardContent>
            </Card>

            {/* 投稿数ランキング */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <span>投稿数ランキング</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">全社員中</span>
                    <span className="text-2xl font-bold text-green-600">{stats.monthly.cardRank}位</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-500">/ {stats.monthly.totalUsers}人中</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* いいねランキング */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>拍手ランキング</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">全社員中</span>
                    <span className="text-2xl font-bold text-red-600">{stats.monthly.likeRank}位</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-500">/ {stats.monthly.totalUsers}人中</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 累計個人インタラクションランキング */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900">累計個人インタラクションランキング</h2>
            <Badge variant="outline">過去の通算データ</Badge>
          </div>

          <Tabs defaultValue="sentCards" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sentCards" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>投稿した相手</span>
              </TabsTrigger>
              <TabsTrigger value="receivedCards" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>投稿してくれた人</span>
              </TabsTrigger>
              <TabsTrigger value="sentLikes" className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>拍手した相手</span>
              </TabsTrigger>
              <TabsTrigger value="receivedLikes" className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>拍手してくれた人</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sentCards" className="mt-6">
              {renderPersonalRanking(
                stats.personal.sentCards,
                "あなたが投稿した相手ランキング",
                <MessageSquare className="h-5 w-5 text-green-500" />,
                "まだ投稿データがありません"
              )}
            </TabsContent>

            <TabsContent value="receivedCards" className="mt-6">
              {renderPersonalRanking(
                stats.personal.receivedCards,
                "あなたに投稿してくれた人ランキング",
                <MessageSquare className="h-5 w-5 text-blue-500" />,
                "まだ受信データがありません"
              )}
            </TabsContent>

            <TabsContent value="sentLikes" className="mt-6">
              {renderPersonalRanking(
                stats.personal.sentLikes,
                "あなたが拍手した相手ランキング",
                <Heart className="h-5 w-5 text-red-500" />,
                "まだ拍手データがありません"
              )}
            </TabsContent>

            <TabsContent value="receivedLikes" className="mt-6">
              {renderPersonalRanking(
                stats.personal.receivedLikes,
                "あなたに拍手してくれた人ランキング",
                <Heart className="h-5 w-5 text-pink-500" />,
                "まだ受信拍手データがありません"
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}