import { apiRequest } from "./queryClient";
import { 
  CardFormRequest, LikeFormRequest, ProfileUpdateRequest,
  CardWithRelations, Card, Like, User
} from "@shared/schema";
import { getAuthToken } from "./auth";

// ユーザー関連
export async function getUsers() {
  try {
    const data = await apiRequest<User[]>("GET", "/api/users");
    return data;
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error);
    throw error;
  }
}

export async function getUser(id: number) {
  try {
    const data = await apiRequest<User>("GET", `/api/users/${id}`);
    return data;
  } catch (error) {
    console.error(`ユーザー(ID:${id})取得エラー:`, error);
    throw error;
  }
}

export async function updateProfile(id: number, data: ProfileUpdateRequest) {
  try {
    const result = await apiRequest<User>("PATCH", `/api/users/${id}`, data);
    console.log("プロフィール更新成功:", result);
    return result;
  } catch (error) {
    console.error("プロフィール更新エラー:", error);
    throw error;
  }
}

// チーム関連
export async function getTeams() {
  try {
    const data = await apiRequest<any[]>("GET", "/api/teams");
    return data;
  } catch (error) {
    console.error("チーム一覧取得エラー:", error);
    throw error;
  }
}

export async function getTeam(id: number) {
  try {
    const data = await apiRequest<any>("GET", `/api/teams/${id}`);
    return data;
  } catch (error) {
    console.error(`チーム(ID:${id})取得エラー:`, error);
    throw error;
  }
}

// カード関連
export async function getCards(options: {
  limit?: number;
  offset?: number;
  senderId?: number;
  recipientId?: number;
} = {}) {
  console.log("getCards呼び出し - オプション:", options);
  
  // クエリパラメータの構築
  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.append("limit", options.limit.toString());
  if (options.offset) queryParams.append("offset", options.offset.toString());
  if (options.senderId) queryParams.append("senderId", options.senderId.toString());
  if (options.recipientId) queryParams.append("recipientId", options.recipientId.toString());
  
  const url = `/api/cards${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  try {
    const data = await apiRequest<CardWithRelations[]>("GET", url);
    console.log("取得したカードデータ:", data);
    return data;
  } catch (error) {
    console.error("カード取得例外:", error);
    throw error;
  }
}

export async function getCard(id: number) {
  try {
    const data = await apiRequest<CardWithRelations>("GET", `/api/cards/${id}`);
    return data;
  } catch (error) {
    console.error("カード詳細取得エラー:", error);
    throw error;
  }
}

export async function createCard(data: CardFormRequest) {
  console.log("カード作成リクエスト:", data);
  try {
    const result = await apiRequest<Card>("POST", "/api/cards", data);
    console.log("カード作成成功:", result);
    return result;
  } catch (error) {
    console.error("カード作成失敗:", error);
    throw error;
  }
}

// いいね関連
export async function createLike(data: LikeFormRequest) {
  try {
    const result = await apiRequest<Like>("POST", "/api/likes", data);
    console.log("いいね作成成功:", result);
    return result;
  } catch (error) {
    console.error("いいね作成失敗:", error);
    throw error;
  }
}

// 部署関連
export async function getDepartments() {
  try {
    const data = await apiRequest("GET", "/api/departments");
    return data;
  } catch (error) {
    console.error("部署一覧取得エラー:", error);
    throw error;
  }
}
