import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context-new";

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
    reactionRate: number;
    cardSenders: any[];
    likeSenders: any[];
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

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: 3,
    staleTime: 5000,
  });

  // デバッグ用ログ
  console.log("Dashboard stats:", stats);
  console.log("Dashboard loading:", isLoading);
  console.log("Dashboard error:", error);

  // データがない場合でもダミーデータで表示を継続
  const displayStats = stats || {
    monthly: {
      pointConversionRate: 0,
      reactionRate: 0,
      cardSenders: [],
      likeSenders: [],
      userCardRank: 0,
      userLikeRank: 0
    },
    personal: {
      sentCards: [],
      receivedCards: [],
      sentLikes: [],
      receivedLikes: []
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">ポイント消費率</h3>
            <p className="text-2xl font-bold text-blue-600">{displayStats.monthly.pointConversionRate}%</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">カード送信ランク</h3>
            <p className="text-2xl font-bold text-green-600">{displayStats.monthly.userCardRank}位</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">拍手ランク</h3>
            <p className="text-2xl font-bold text-pink-600">{displayStats.monthly.userLikeRank}位</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">リアクション率</h3>
            <p className="text-2xl font-bold text-gray-600">{displayStats.monthly.reactionRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">カード送信ランキング</h2>
            {displayStats.personal.sentCards.length > 0 ? (
              displayStats.personal.sentCards.slice(0, 5).map((item, index) => (
                <div key={item.user.id} className="flex justify-between items-center py-2">
                  <span className="text-sm">{index + 1}. {item.user.displayName || item.user.name}</span>
                  <span className="font-bold">{item.count}回</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">データがありません</p>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">カード受信ランキング</h2>
            {displayStats.personal.receivedCards.length > 0 ? (
              displayStats.personal.receivedCards.slice(0, 5).map((item, index) => (
                <div key={item.user.id} className="flex justify-between items-center py-2">
                  <span className="text-sm">{index + 1}. {item.user.displayName || item.user.name}</span>
                  <span className="font-bold">{item.count}回</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">データがありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}