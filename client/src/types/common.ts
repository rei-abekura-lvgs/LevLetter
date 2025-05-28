import { CardWithRelations, User } from "@shared/schema";

// タブの種類
export type TabType = "all" | "received" | "sent" | "liked";

// ソート順の種類
export type SortOrder = "newest" | "popular";

// タブのカウント情報
export interface TabCounts {
  all: number;
  sent: number;
  received: number;
  liked: number;
  isReceivedImportant: boolean;
  isSentImportant: boolean;
}

// ダッシュボード統計の型
export interface DashboardStats {
  weekly: {
    currentPoints: number;
    maxPoints: number;
    usedPoints: number;
  };
  monthly: {
    received: {
      points: number;
      cards: number;
      likes: number;
    };
    sent: {
      points: number;
      cards: number;
      likes: number;
    };
  };
  lifetime: {
    received: {
      points: number;
      cards: number;
      likes: number;
    };
    sent: {
      points: number;
      cards: number;
      likes: number;
    };
  };
  rankings: {
    cardSentTo: Array<{ user: User; count: number }>;
    cardReceivedFrom: Array<{ user: User; count: number }>;
    likeSentTo: Array<{ user: User; count: number }>;
    likeReceivedFrom: Array<{ user: User; count: number }>;
  };
}

// 通知の型
export interface Notification {
  id: string;
  userId: number;
  type: "new_card" | "new_like";
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCardId?: number;
  relatedUser?: {
    id: number;
    name: string;
    displayName: string;
  };
}

// API レスポンスの型
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// いいねの型
export interface Like {
  id: number;
  cardId: number;
  userId: number;
  points: number;
  user: User;
  createdAt: Date;
}

// カードフィルターの設定
export interface CardFilters {
  tab: TabType;
  sortOrder: SortOrder;
  searchQuery?: string;
}