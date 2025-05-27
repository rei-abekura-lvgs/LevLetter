import { useQuery } from "@tanstack/react-query";
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

  const { data: rankings, isLoading, error } = useQuery<RankingData>({
    queryKey: ["/api/rankings"],
  });

  // データ構造を確認するためのデバッグ
  console.log("Rankings data:", rankings);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <p className="text-gray-500">読み込み中...</p>
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

  const renderRankingCard = (title: string, items: RankingItem[], valueKey: 'totalPoints' | 'cardCount' | 'likeCount') => (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {items.length > 0 ? (
        items.slice(0, 10).map((item, index) => (
          <div key={item.user.id} className="flex justify-between items-center py-2">
            <span className="text-sm">
              {index + 1}. {item.user.displayName || item.user.name}
            </span>
            <span className="font-bold">
              {valueKey === 'totalPoints' && item.totalPoints}
              {valueKey === 'cardCount' && item.cardCount}
              {valueKey === 'likeCount' && item.likeCount}
              {valueKey === 'totalPoints' ? 'pt' : '回'}
            </span>
          </div>
        ))
      ) : (
        <p className="text-gray-500">データがありません</p>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">月間ランキング</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderRankingCard("ポイント付与ランキング", rankings.pointGivers, 'totalPoints')}
          {renderRankingCard("ポイント受信ランキング", rankings.pointReceivers, 'totalPoints')}
          {renderRankingCard("カード送信ランキング", rankings.cardSenders, 'cardCount')}
          {renderRankingCard("カード受信ランキング", rankings.cardReceivers, 'cardCount')}
          {renderRankingCard("拍手送信ランキング", rankings.likeSenders, 'likeCount')}
          {renderRankingCard("拍手受信ランキング", rankings.likeReceivers, 'likeCount')}
        </div>
      </div>
    </div>
  );
}