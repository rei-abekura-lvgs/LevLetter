import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Search, UserIcon, Activity, Heart, MessageSquare, Users, TrendingUp, Star, Building, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCardSchema, type InsertCard, type CardWithRelations, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import CardForm from "@/components/card-form";
import { CardItem } from "@/components/card-item";

interface HomeProps {
  user: User;
  isCardFormOpen?: boolean;
  setIsCardFormOpen?: (open: boolean) => void;
}

export default function Home({ user, isCardFormOpen: propIsCardFormOpen, setIsCardFormOpen: propSetIsCardFormOpen }: HomeProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [localIsCardFormOpen, setLocalIsCardFormOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [filterValue, setFilterValue] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<{type: 'person' | 'department', value: string} | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
  // 日本語名をローマ字に変換する汎用関数
  const convertToRomaji = (name: string): string => {
    if (!name) return '';
    
    // 基本的な漢字→ローマ字変換マッピング
    return name
      .replace(/阿部倉/g, 'abekura')
      .replace(/怜/g, 'rei')
      .replace(/的場/g, 'matoba')
      .replace(/拓也/g, 'takuya')
      .replace(/田中/g, 'tanaka')
      .replace(/佐藤/g, 'sato')
      .replace(/鈴木/g, 'suzuki')
      .replace(/高橋/g, 'takahashi')
      .replace(/山田/g, 'yamada')
      .replace(/小林/g, 'kobayashi')
      .replace(/加藤/g, 'kato')
      .replace(/吉田/g, 'yoshida')
      .replace(/山本/g, 'yamamoto')
      .replace(/中村/g, 'nakamura')
      .replace(/小川/g, 'ogawa')
      .replace(/斎藤/g, 'saito')
      .replace(/松本/g, 'matsumoto')
      .replace(/井上/g, 'inoue')
      .replace(/木村/g, 'kimura')
      .replace(/林/g, 'hayashi')
      .replace(/清水/g, 'shimizu')
      .replace(/山口/g, 'yamaguchi')
      .replace(/森/g, 'mori')
      .replace(/太郎/g, 'taro')
      .replace(/次郎/g, 'jiro')
      .replace(/三郎/g, 'saburo')
      .replace(/花子/g, 'hanako')
      .replace(/美香/g, 'mika')
      .replace(/真一/g, 'shinichi')
      .replace(/健太/g, 'kenta')
      .replace(/優/g, 'yu')
      .replace(/翔/g, 'sho')
      .replace(/愛/g, 'ai')
      .replace(/恵/g, 'megumi')
      .replace(/修/g, 'osamu')
      .replace(/聡/g, 'satoshi')
      .replace(/誠/g, 'makoto')
      .replace(/牧野/g, 'makino')
      .replace(/康太/g, 'kota');
  };

  const { toast } = useToast();
  
  // 既読カードIDを管理（localStorageに保存）
  const [readCardIds, setReadCardIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('readCardIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [unreadCardIds, setUnreadCardIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('unreadCardIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const isCardFormOpen = propIsCardFormOpen !== undefined ? propIsCardFormOpen : localIsCardFormOpen;
  const setIsCardFormOpen = propSetIsCardFormOpen || setLocalIsCardFormOpen;

  const queryClient = useQueryClient();

  const { data: cards = [], refetch: refetchCards, isLoading } = useQuery<CardWithRelations[]>({
    queryKey: ['/api/cards'],
    refetchInterval: 30000,
  });

  // 全ユーザーデータを取得して検索用に使用
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // 部署のユニークリストを生成（カードから）
  const uniqueDepartments = Array.from(new Set(cards.flatMap(card => {
    const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
    return allUsers.map(user => user.department).filter(Boolean);
  }))).sort();

  // 各タブの通知数を計算（重要な通知のみ目立たせる）
  const getTabCounts = () => {
    // 受信したカード数（未読のみ）
    const receivedCards = cards.filter(card => 
      card.recipientId === user.id || 
      (card.additionalRecipients as User[] || []).some(r => r.id === user.id)
    );
    
    const unreadReceivedCount = receivedCards.filter(card => !readCardIds.has(card.id)).length;

    // 送信したカード数
    const sentCards = cards.filter(card => card.senderId === user.id);

    // いいねされたカード数（自分が送信したカードに対するいいね）
    const likedCount = cards.filter(card => {
      if (card.senderId !== user.id) return false;
      
      const cardUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
      const cardUserIds = cardUsers.map(u => u.id);
      
      return card.likes && card.likes.some((like: any) => !cardUserIds.includes(like.userId));
    }).length;

    return {
      all: cards.length,
      received: receivedCards.length,
      unreadReceived: unreadReceivedCount,
      sent: sentCards.length,
      liked: likedCount
    };
  };

  const tabCounts = getTabCounts();

  // カードをフィルタリングする関数
  const getFilteredCards = () => {
    let filteredCards = cards;

    // 人名または部署でのフィルタリング
    if (selectedFilter) {
      if (selectedFilter.type === 'person') {
        filteredCards = filteredCards.filter(card => {
          const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
          return allUsers.some(u => (u.displayName || u.name) === selectedFilter.value);
        });
      } else if (selectedFilter.type === 'department') {
        filteredCards = filteredCards.filter(card => {
          const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
          return allUsers.some(u => u.department === selectedFilter.value);
        });
      }
    }

    // タブによるフィルタリング
    switch (activeTab) {
      case "received":
        return filteredCards.filter(card => 
          card.recipientId === user.id || 
          (card.additionalRecipients as User[] || []).some(r => r.id === user.id)
        );
      case "sent":
        return filteredCards.filter(card => card.senderId === user.id);
      case "liked":
        return filteredCards.filter(card => {
          if (card.senderId !== user.id) return false;
          
          const cardUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
          const cardUserIds = cardUsers.map(u => u.id);
          
          return card.likes && card.likes.some((like: any) => !cardUserIds.includes(like.userId));
        });
      default:
        return filteredCards;
    }
  };

  const filteredCards = getFilteredCards();

  // Intersection Observer for auto-marking cards as read
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (activeTab === "received") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const cardId = parseInt(entry.target.getAttribute('data-card-id') || '0');
              if (cardId && !readCardIds.has(cardId)) {
                markAsRead(cardId);
              }
            }
          });
        },
        { threshold: 0.5 }
      );
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [activeTab, readCardIds]);

  const markAsRead = (cardId: number) => {
    setReadCardIds(prev => {
      const newSet = new Set(prev);
      newSet.add(cardId);
      localStorage.setItem('readCardIds', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleRefresh = () => {
    refetchCards();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 150;
    
    if (isUpSwipe) {
      handleRefresh();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">LevLetter</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="container mx-auto p-6 space-y-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">LevLetter</h1>
        <div className="flex items-center space-x-4">
          <CardForm 
            user={user} 
            isOpen={isCardFormOpen}
            setIsOpen={setIsCardFormOpen}
            onSuccess={handleRefresh}
          />
        </div>
      </div>

      {/* フィルター機能 */}
      <div className="flex items-center space-x-2">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={searchOpen}
              className="w-full justify-between text-left font-normal"
            >
              {selectedFilter 
                ? `${selectedFilter.type === 'person' ? '👤' : '🏢'} ${selectedFilter.value}`
                : "人名・部署名で検索..."}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="人名または部署名を入力..." 
                value={filterValue}
                onValueChange={setFilterValue}
              />
              <CommandList>
                {!filterValue ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    人名または部署名を入力してください
                  </div>
                ) : (
                  <>
                    <CommandEmpty>見つかりませんでした。</CommandEmpty>
                    
                    {/* 人名セクション - 検索語が入力された時のみ表示 */}
                    <CommandGroup heading="👤 人名">
                      {allUsers
                        .filter((user: User) => {
                          const displayName = user.displayName || user.name;
                          const romanjiKeywords = convertToRomaji(displayName);
                          const searchLower = filterValue.toLowerCase();
                          
                          return displayName.toLowerCase().includes(searchLower) ||
                                 romanjiKeywords.toLowerCase().includes(searchLower) ||
                                 displayName.includes(filterValue);
                        })
                        .map((user: User) => {
                          const displayName = user.displayName || user.name;
                          
                          return (
                            <CommandItem
                              key={`person-${user.id}`}
                              value={displayName}
                              onSelect={() => {
                                setSelectedFilter({type: 'person', value: displayName});
                                setFilterValue("");
                                setSearchOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedFilter?.type === 'person' && selectedFilter?.value === displayName ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <UserIcon className="mr-2 h-4 w-4 text-blue-500" />
                              {displayName}
                            </CommandItem>
                          );
                        })}
                    </CommandGroup>
                    
                    {/* 部署セクション */}
                    <CommandGroup heading="🏢 部署">
                      {uniqueDepartments
                        .filter((dept: string) => 
                          dept.toLowerCase().includes(filterValue.toLowerCase()) ||
                          dept.includes(filterValue)
                        )
                        .map((dept: string) => {
                          // この部署の人たち
                          const deptMembers = Array.from(new Set(cards.flatMap(card => {
                            const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
                            return allUsers.filter(user => user.department === dept).map(user => user.displayName || user.name);
                          }))).sort();
                          
                          return (
                            <CommandItem
                              key={`dept-${dept}`}
                              value={dept}
                              onSelect={() => {
                                setSelectedFilter({type: 'department', value: dept});
                                setSelectedDepartment(dept);
                                setFilterValue("");
                                setSearchOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedFilter?.type === 'department' && selectedFilter?.value === dept ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <Activity className="mr-2 h-4 w-4 text-green-500" />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{dept}</span>
                                <span className="text-xs text-gray-500">
                                  {deptMembers.length}名: {deptMembers.slice(0, 3).join(", ")}
                                  {deptMembers.length > 3 && " など"}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {/* フィルタークリアボタン */}
        {selectedFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFilter(null);
              setSelectedDepartment(null);
            }}
            className="h-8 px-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="relative">
            すべて
            {tabCounts.all > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {tabCounts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" className="relative">
            受信
            {tabCounts.unreadReceived > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {tabCounts.unreadReceived}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="relative">
            送信
            {tabCounts.sent > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {tabCounts.sent}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="liked" className="relative">
            いいね
            {tabCounts.liked > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {tabCounts.liked}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* カード一覧 */}
        <TabsContent value={activeTab} className="space-y-4">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {selectedFilter 
                  ? `「${selectedFilter.value}」に関連するカードが見つかりません`
                  : "カードがありません"}
              </p>
              {!selectedFilter && (
                <p className="text-sm text-gray-500 mt-2">
                  感謝の気持ちを伝えるカードを送ってみましょう！
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCards.map((card) => {
                const isUnread = activeTab === "received" && !readCardIds.has(card.id);
                return (
                  <CardItem
                    key={card.id}
                    card={card}
                    currentUser={user}
                    onRefresh={handleRefresh}
                    onMarkAsRead={markAsRead}
                    ref={observerRef.current && isUnread ? (el: HTMLDivElement | null) => {
                      if (el) {
                        el.setAttribute('data-card-id', card.id.toString());
                        observerRef.current?.observe(el);
                      }
                    } : undefined}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}