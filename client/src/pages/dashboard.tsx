import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context-new";
import { TrendingUp, Users, Heart, Award, ArrowUp, ArrowDown, Mail } from "lucide-react";

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

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: 3,
    staleTime: 5000,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">データを読み込めませんでした</h3>
          <p className="text-gray-500">しばらく時間をおいてから再度お試しください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
        <p className="text-gray-600">あなたの活動状況と統計情報をご確認いただけます</p>
      </div>
      
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">ポイント消費率</p>
              <p className="text-3xl font-bold text-[#3990EA]">{stats.monthly.pointConversionRate}%</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-[#3990EA]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <span>今月の利用状況</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">カード送信順位</p>
              <p className="text-3xl font-bold text-green-600">#{stats.monthly.userCardRank || '?'}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <span>過去1ヶ月の順位</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">カード送信順位</p>
              <p className="text-3xl font-bold text-purple-600">#{stats.monthly.userCardRank || '?'}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <span>過去1ヶ月の順位</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">いいね送信順位</p>
              <p className="text-3xl font-bold text-orange-600">#{stats.monthly.userLikeRank || '?'}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <Heart className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <span>過去1ヶ月の順位</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 個人的なやりとりランキング */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ArrowUp className="h-5 w-5 text-[#3990EA]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">カード送信先TOP5</h2>
                <p className="text-sm text-gray-500">よく送信している相手</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {stats.personal.sentCards && stats.personal.sentCards.length > 0 ? (
              <div className="space-y-4">
                {stats.personal.sentCards.slice(0, 5).map((item, index) => (
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
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
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
                <h2 className="text-lg font-semibold text-gray-900">カード受信元TOP5</h2>
                <p className="text-sm text-gray-500">よく受信している相手</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {stats.personal.receivedCards && stats.personal.receivedCards.length > 0 ? (
              <div className="space-y-4">
                {stats.personal.receivedCards.slice(0, 5).map((item, index) => (
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
                <Heart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">まだカードを受信していません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}