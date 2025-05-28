import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context-new";
import { Trophy, Medal, Award, Heart, Send, ArrowUpDown, Crown, Users } from "lucide-react";
import { UnifiedAvatar } from "@/components/unified-avatar";

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

  const { data: rankings, isLoading, error } = useQuery<RankingData>({
    queryKey: ["/api/rankings"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !rankings) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ランキングデータを読み込めませんでした</h3>
          <p className="text-gray-500">しばらく時間をおいてから再度お試しください。</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <div className="h-5 w-5 flex items-center justify-center text-xs font-bold text-gray-500">#{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  const renderRankingCard = (
    title: string, 
    items: RankingItem[], 
    valueKey: 'totalPoints' | 'cardCount' | 'likeCount',
    icon: React.ReactNode,
    color: string
  ) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">今月の活動ランキング</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.slice(0, 10).map((item, index) => {
              const rank = index + 1;
              const isCurrentUser = user && item.user.id === user.id;
              
              return (
                <div
                  key={item.user.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isCurrentUser 
                      ? 'bg-blue-50 border border-blue-200' 
                      : getRankBg(rank)
                  } hover:shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(rank)}
                    <UnifiedAvatar
                      user={item.user}
                      size="sm"
                    />
                    <div>
                      <p className={`font-medium ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                        {item.user.displayName || item.user.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(あなた)</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">
                        {item.user.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      rank <= 3 ? 'text-amber-600' : isCurrentUser ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {valueKey === 'totalPoints' && item.totalPoints}
                      {valueKey === 'cardCount' && item.cardCount}
                      {valueKey === 'likeCount' && item.likeCount}
                      <span className="text-sm font-normal ml-1">
                        {valueKey === 'totalPoints' ? 'pt' : '回'}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">まだデータがありません</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">月間ランキング</h1>
        <p className="text-gray-600">今月の活動状況をランキング形式でご確認いただけます</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderRankingCard(
          "ポイント付与ランキング", 
          rankings.pointGivers, 
          'totalPoints',
          <ArrowUpDown className="h-5 w-5 text-blue-600" />,
          "bg-blue-50"
        )}
        {renderRankingCard(
          "ポイント受信ランキング", 
          rankings.pointReceivers, 
          'totalPoints',
          <Trophy className="h-5 w-5 text-green-600" />,
          "bg-green-50"
        )}
        {renderRankingCard(
          "カード送信ランキング", 
          rankings.cardSenders, 
          'cardCount',
          <Send className="h-5 w-5 text-purple-600" />,
          "bg-purple-50"
        )}
        {renderRankingCard(
          "カード受信ランキング", 
          rankings.cardReceivers, 
          'cardCount',
          <Award className="h-5 w-5 text-orange-600" />,
          "bg-orange-50"
        )}
        {renderRankingCard(
          "いいね送信ランキング", 
          rankings.likeSenders, 
          'likeCount',
          <Heart className="h-5 w-5 text-pink-600" />,
          "bg-pink-50"
        )}
        {renderRankingCard(
          "いいね受信ランキング", 
          rankings.likeReceivers, 
          'likeCount',
          <Medal className="h-5 w-5 text-indigo-600" />,
          "bg-indigo-50"
        )}
      </div>
    </div>
  );
}