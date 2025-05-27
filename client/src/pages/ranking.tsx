import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, MessageSquare, Heart, Award, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context-new";

interface User {
  id: number;
  email: string;
  name: string;
  displayName: string | null;
  department: string | null;
  avatarColor: string;
  customAvatarUrl: string | null;
  weeklyPoints: number;
  totalPointsReceived: number;
  weeklyPointsReceived: number;
}

interface RankingItem {
  user: User;
  totalPoints?: number;
  cardCount?: number;
  likeCount?: number;
  rank: number;
}

interface RankingData {
  pointGivers: RankingItem[];
  pointReceivers: RankingItem[];
  cardSenders: RankingItem[];
  cardReceivers: RankingItem[];
  likeSenders: RankingItem[];
  likeReceivers: RankingItem[];
}

export default function Ranking() {
  const { user } = useAuth();

  const { data: rankings, isLoading } = useQuery<RankingData>({
    queryKey: ["/api/rankings"],
  });

  const getMonthDateRange = () => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    return `${oneMonthAgo.getFullYear()}年${oneMonthAgo.getMonth() + 1}月${oneMonthAgo.getDate()}日 - ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  };

  const renderRankingCard = (item: RankingItem, index: number) => {
    const isTopThree = index < 3;
    const user = item.user;
    
    return (
      <Card key={user.id} className={`${isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-amber-100 text-amber-700' :
                'bg-gray-50 text-gray-600'
              }`}>
                {index < 3 ? (
                  <Trophy className="w-5 h-5" />
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {user.customAvatarUrl ? (
                  <img
                    src={user.customAvatarUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-${user.avatarColor}`}>
                    {user.name.charAt(0)}
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-gray-900">{user.displayName || user.name}</h3>
                  <p className="text-sm text-gray-500">{user.department}</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                index === 0 ? 'text-yellow-600' :
                index === 1 ? 'text-gray-600' :
                index === 2 ? 'text-amber-600' :
                'text-gray-700'
              }`}>
                {item.totalPoints || item.cardCount || item.likeCount || 0}
              </div>
              <div className="text-xs text-gray-500">
                {item.totalPoints !== undefined ? 'pt' : '回'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!rankings) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <p className="text-gray-500">ランキングデータを読み込めませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <span>月間ランキング</span>
            </h1>
            <p className="text-gray-600 mt-1">最近1ヶ月のアクティビティランキング</p>
          </div>
          <div className="text-sm text-gray-500 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{getMonthDateRange()}</span>
          </div>
        </div>

        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>ポイント</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>投稿数</span>
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>拍手数</span>
            </TabsTrigger>
          </TabsList>

          {/* ポイントランキング */}
          <TabsContent value="points" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-bold">ポイント付与ランキング</h2>
                    <Badge variant="secondary">送った</Badge>
                  </div>
                  <div className="space-y-3">
                    {rankings.pointGivers.length > 0 ? (
                      rankings.pointGivers.slice(0, 10).map((item, index) => renderRankingCard(item, index))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        データがありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Award className="h-5 w-5 text-purple-500" />
                    <h2 className="text-xl font-bold">ポイント獲得ランキング</h2>
                    <Badge variant="secondary">受け取った</Badge>
                  </div>
                  <div className="space-y-3">
                    {rankings.pointReceivers.length > 0 ? (
                      rankings.pointReceivers.slice(0, 10).map((item, index) => renderRankingCard(item, index))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        データがありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 投稿数ランキング */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <h2 className="text-xl font-bold">カード送信ランキング</h2>
                    <Badge variant="secondary">送った</Badge>
                  </div>
                  <div className="space-y-3">
                    {rankings.cardSenders.length > 0 ? (
                      rankings.cardSenders.slice(0, 10).map((item, index) => renderRankingCard(item, index))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        データがありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-teal-500" />
                    <h2 className="text-xl font-bold">カード受信ランキング</h2>
                    <Badge variant="secondary">受け取った</Badge>
                  </div>
                  <div className="space-y-3">
                    {rankings.cardReceivers.length > 0 ? (
                      rankings.cardReceivers.slice(0, 10).map((item, index) => renderRankingCard(item, index))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        データがありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 拍手数ランキング */}
          <TabsContent value="likes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Heart className="h-5 w-5 text-red-500" />
                    <h2 className="text-xl font-bold">拍手送信ランキング</h2>
                    <Badge variant="secondary">送った</Badge>
                  </div>
                  <div className="space-y-3">
                    {rankings.likeSenders.length > 0 ? (
                      rankings.likeSenders.slice(0, 10).map((item, index) => renderRankingCard(item, index))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        データがありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <h2 className="text-xl font-bold">拍手受信ランキング</h2>
                    <Badge variant="secondary">受け取った</Badge>
                  </div>
                  <div className="space-y-3">
                    {rankings.likeReceivers.length > 0 ? (
                      rankings.likeReceivers.slice(0, 10).map((item, index) => renderRankingCard(item, index))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        データがありません
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}