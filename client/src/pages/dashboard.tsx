import { useAuth } from "../context/auth-context-new";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { TrendingUp, Award, Trophy, Users, Gift, Calendar, Target, Zap } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface DashboardStats {
  pointConversionRate: number;
  reactionRate: number;
  sendingRank: number;
  receivingRank: number;
  totalUsers: number;
  cardsThisWeek: number;
  pointsGivenThisWeek: number;
  topSenders: Array<{
    id: number;
    name: string;
    displayName: string;
    customAvatarUrl: string | null;
    cardsCount: number;
  }>;
  topReceivers: Array<{
    id: number;
    name: string;
    displayName: string;
    customAvatarUrl: string | null;
    pointsReceived: number;
  }>;
  topGivers: Array<{
    id: number;
    name: string;
    displayName: string;
    customAvatarUrl: string | null;
    pointsGiven: number;
  }>;
  topAppreciatedUsers: Array<{
    id: number;
    name: string;
    displayName: string;
    customAvatarUrl: string | null;
    totalPoints: number;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  const getCurrentWeekRange = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() + 6) % 7);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return `${format(monday, 'M/d', { locale: ja })} - ${format(sunday, 'M/d', { locale: ja })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-gray-600 mt-1">最近1ヶ月のデータ</p>
          </div>
          <div className="text-sm text-gray-500">
            {getCurrentWeekRange()}
          </div>
        </div>

        {/* ユーザープロフィールカード */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                {user.customAvatarUrl ? (
                  <img
                    src={user.customAvatarUrl}
                    alt={user.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">{user.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{user.displayName || user.name}</h2>
                <p className="text-blue-100">{user.department}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Gift className="h-4 w-4" />
                    <span className="text-sm">もらったポイント: {user.weeklyPointsReceived || 0}pt</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">前週までのポイント: {(user.totalPointsReceived || 0) - (user.weeklyPointsReceived || 0)}pt</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI指標 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">ポイント消化率</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-2">{stats.pointConversionRate}%</div>
              <Progress value={stats.pointConversionRate} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">リアクション率</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">{stats.reactionRate}%</div>
              <Progress value={stats.reactionRate} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-gray-600">投稿数ランキング</span>
              </div>
              <div className="text-2xl font-bold text-amber-600 mb-2">{stats.sendingRank}位</div>
              <p className="text-xs text-gray-500">全{stats.totalUsers}人中</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">拍手数ランキング</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-2">{stats.receivingRank}位</div>
              <p className="text-xs text-gray-500">全{stats.totalUsers}人中</p>
            </CardContent>
          </Card>
        </div>

        {/* 累計データ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>あなたが投稿した人</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topSenders.slice(0, 5).map((sender, index) => (
                  <div key={sender.id} className="flex items-center space-x-3">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {sender.customAvatarUrl ? (
                        <img
                          src={sender.customAvatarUrl}
                          alt={sender.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">{sender.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sender.displayName || sender.name}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{sender.cardsCount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5 text-green-500" />
                <span>あなたに投稿した人</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topReceivers.slice(0, 5).map((receiver, index) => (
                  <div key={receiver.id} className="flex items-center space-x-3">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {receiver.customAvatarUrl ? (
                        <img
                          src={receiver.customAvatarUrl}
                          alt={receiver.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">{receiver.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{receiver.displayName || receiver.name}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{receiver.pointsReceived}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span>あなたが拍手した人</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topGivers.slice(0, 5).map((giver, index) => (
                  <div key={giver.id} className="flex items-center space-x-3">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {giver.customAvatarUrl ? (
                        <img
                          src={giver.customAvatarUrl}
                          alt={giver.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">{giver.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{giver.displayName || giver.name}</p>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{giver.pointsGiven}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span>あなたに拍手した人</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topAppreciatedUsers.slice(0, 5).map((user, index) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.customAvatarUrl ? (
                        <img
                          src={user.customAvatarUrl}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.displayName || user.name}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-600">{user.totalPoints}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}