import { useAuth } from "../context/auth-context-new";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Trophy, Medal, Award, Crown, Star, TrendingUp, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface RankingUser {
  id: number;
  name: string;
  displayName: string | null;
  department: string | null;
  customAvatarUrl: string | null;
  avatarColor: string;
  weeklyPoints: number;
  totalPointsReceived: number;
  weeklyPointsReceived: number;
  rank: number;
}

interface RankingData {
  weeklyPointsRanking: RankingUser[];
  totalPointsRanking: RankingUser[];
  weeklyReceivedRanking: RankingUser[];
  currentUser: RankingUser | null;
}

export default function Ranking() {
  const { user } = useAuth();
  
  const { data: rankings, isLoading } = useQuery<RankingData>({
    queryKey: ["/api/rankings"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !rankings) return null;

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "secondary";
    }
  };

  const getUserAvatarColor = (avatarColor: string) => {
    const colorMap: { [key: string]: string } = {
      'primary-500': 'bg-blue-500',
      'red': 'bg-red-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'indigo': 'bg-indigo-500',
      'orange': 'bg-orange-500',
    };
    return colorMap[avatarColor] || 'bg-gray-500';
  };

  const RankingCard = ({ users, title, subtitle, pointKey, icon }: {
    users: RankingUser[];
    title: string;
    subtitle: string;
    pointKey: 'weeklyPoints' | 'totalPointsReceived' | 'weeklyPointsReceived';
    icon: React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <div>
            <div>{title}</div>
            <p className="text-sm font-normal text-gray-600">{subtitle}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.slice(0, 10).map((rankUser, index) => {
            const isCurrentUser = rankUser.id === user.id;
            const points = rankUser[pointKey];
            
            return (
              <div 
                key={rankUser.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(index + 1)}
                    <Badge variant={getRankBadgeVariant(index + 1)} className="min-w-[2rem] h-6 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                  
                  <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                    {rankUser.customAvatarUrl ? (
                      <img
                        src={rankUser.customAvatarUrl}
                        alt={rankUser.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${getUserAvatarColor(rankUser.avatarColor)}`}>
                        <span className="text-sm">{rankUser.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                      {rankUser.displayName || rankUser.name}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(あなた)</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{rankUser.department}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className={`text-lg font-bold ${
                    index === 0 ? 'text-yellow-600' :
                    index === 1 ? 'text-gray-600' :
                    index === 2 ? 'text-amber-600' :
                    'text-gray-700'
                  }`}>
                    {points}
                  </span>
                  <span className="text-xs text-gray-500">pt</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <span>ポイントランキング</span>
            </h1>
            <p className="text-gray-600 mt-1">メンバーのポイント獲得状況をチェック</p>
          </div>
          <div className="text-sm text-gray-500 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>今週: {getCurrentWeekRange()}</span>
          </div>
        </div>

        {/* 現在のユーザーのポジション */}
        {rankings.currentUser && (
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
                  <div>
                    <h2 className="text-xl font-bold">{user.displayName || user.name}</h2>
                    <p className="text-blue-100">{user.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{user.weeklyPoints}</div>
                  <div className="text-sm text-blue-100">利用可能ポイント</div>
                  <div className="text-lg font-semibold mt-1">{user.totalPointsReceived}</div>
                  <div className="text-xs text-blue-100">累計獲得ポイント</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ランキングタブ */}
        <Tabs defaultValue="weekly-received" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly-received" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>今週獲得ポイント</span>
            </TabsTrigger>
            <TabsTrigger value="total-received" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>累計獲得ポイント</span>
            </TabsTrigger>
            <TabsTrigger value="weekly-available" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>利用可能ポイント</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly-received">
            <RankingCard
              users={rankings.weeklyReceivedRanking}
              title="今週獲得ポイントランキング"
              subtitle={`今週（${getCurrentWeekRange()}）に獲得したポイント`}
              pointKey="weeklyPointsReceived"
              icon={<Star className="h-5 w-5 text-yellow-500" />}
            />
          </TabsContent>

          <TabsContent value="total-received">
            <RankingCard
              users={rankings.totalPointsRanking}
              title="累計獲得ポイントランキング"
              subtitle="これまでに獲得したポイントの総計"
              pointKey="totalPointsReceived"
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            />
          </TabsContent>

          <TabsContent value="weekly-available">
            <RankingCard
              users={rankings.weeklyPointsRanking}
              title="利用可能ポイントランキング"
              subtitle="現在利用可能な週次ポイント"
              pointKey="weeklyPoints"
              icon={<Target className="h-5 w-5 text-blue-500" />}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}