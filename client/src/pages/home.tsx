import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardWithRelations, User } from "@shared/schema";
import CardForm from "@/components/card-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Heart, MessageSquare, RotateCcw, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { getCards } from "@/lib/api";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// カードコンポーネント
const CardItem = ({ card }: { card: CardWithRelations }) => {
  const formattedDate = format(new Date(card.createdAt), 'yyyy年MM月dd日', { locale: ja });
  const formattedTime = format(new Date(card.createdAt), 'HH:mm', { locale: ja });
  const recipientName = card.recipientType === "user" 
    ? (card.recipient as User).displayName || (card.recipient as User).name
    : "チーム";

  // ユーザーアバターのイニシャルを作成
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-gray-50 p-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar className={`bg-${card.sender.avatarColor || 'blue-500'} h-8 w-8`}>
              <AvatarFallback>{getInitials(card.sender.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{card.sender.displayName || card.sender.name}</div>
              <div className="text-xs text-gray-500">{card.sender.department}</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
            <Clock className="h-3 w-3 ml-2 mr-1" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {card.recipientType === "user" && (
          <div className="flex items-center mb-3">
            <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600">宛先: {recipientName}</span>
          </div>
        )}
        <p className="text-gray-800 whitespace-pre-line">{card.message}</p>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Heart className="h-4 w-4 mr-1 text-red-400" />
          <span>{card.totalPoints || 0} いいね</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          <MessageSquare className="h-4 w-4 mr-1" />
          詳細
        </Button>
      </CardFooter>
    </Card>
  );
};

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "popular">("newest");

  // APIからカードデータを取得
  const {
    data: cards = [],
    isLoading,
    error,
    refetch
  } = useQuery<CardWithRelations[]>({
    queryKey: ["/api/cards"],
    queryFn: () => getCards({}),
    enabled: !!user?.id
  });

  // データの読み込み確認のログ
  useEffect(() => {
    if (cards.length > 0) {
      console.log("カード取得レスポンス:", 200, "OK");
      console.log("取得したカードデータ:", cards);
    }
  }, [cards]);

  // カードの並び替え
  const sortedCards = [...cards].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    }
  });

  // 並び替え変更ハンドラ
  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "popular");
  };

  // データ更新ハンドラ
  const refreshCards = () => {
    refetch();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* カード送信フォーム */}
      <CardForm />
      
      {/* タイムライン */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">全社タイムライン</h2>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-gray-500 bg-gray-50">
              {cards.length}件のカード
            </Badge>
            <Select defaultValue="newest" onValueChange={handleSortChange}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="新しい順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">新しい順</SelectItem>
                <SelectItem value="popular">人気順</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCards}
              className="ml-2"
              disabled={isLoading}
            >
              <RotateCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </div>
        
        {/* カードリスト */}
        <div className="space-y-4">
          {isLoading ? (
            // ローディング状態
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : error ? (
            // エラー表示
            <div className="bg-red-50 text-red-800 p-8 rounded-lg text-center border border-red-200">
              <p className="mb-4 font-medium">エラーが発生しました</p>
              <p className="text-sm">{(error as Error)?.message || "データの取得に失敗しました"}</p>
              <Button 
                variant="outline" 
                className="mt-4 bg-white"
                onClick={refreshCards}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                再試行
              </Button>
            </div>
          ) : sortedCards.length === 0 ? (
            // データなし
            <div className="bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
              <p className="mb-4">カードがまだありません。</p>
              <p>最初のサンクスカードを送ってみましょう！</p>
            </div>
          ) : (
            // カード表示
            <div className="space-y-4">
              {sortedCards.map(card => (
                <CardItem key={`card-${card.id}`} card={card} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}