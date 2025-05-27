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
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <p className="text-gray-500">ダッシュボードデータを読み込めませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">ポイント消費率</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.monthly.pointConversionRate}%</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">カード送信ランク</h3>
            <p className="text-2xl font-bold text-green-600">{stats.monthly.cardRank}位</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">拍手ランク</h3>
            <p className="text-2xl font-bold text-pink-600">{stats.monthly.likeRank}位</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">総ユーザー数</h3>
            <p className="text-2xl font-bold text-gray-600">{stats.monthly.totalUsers}人</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">カード送信ランキング</h2>
            {stats.personal.sentCards.length > 0 ? (
              stats.personal.sentCards.slice(0, 5).map((item, index) => (
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
            {stats.personal.receivedCards.length > 0 ? (
              stats.personal.receivedCards.slice(0, 5).map((item, index) => (
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