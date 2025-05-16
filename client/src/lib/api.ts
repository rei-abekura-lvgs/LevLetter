import { apiRequest } from "./queryClient";
import { CardFormRequest, LikeFormRequest, ProfileUpdateRequest } from "@shared/schema";
import { getAuthToken } from "./auth";

// ユーザー関連
export async function getUsers() {
  const token = getAuthToken();
  if (!token) throw new Error("認証が必要です");
  
  const res = await fetch("/api/users", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error("ユーザー情報の取得に失敗しました");
  }
  
  return res.json();
}

export async function getUser(id: number) {
  const token = getAuthToken();
  if (!token) throw new Error("認証が必要です");
  
  const res = await fetch(`/api/users/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error("ユーザー情報の取得に失敗しました");
  }
  
  return res.json();
}

export async function updateProfile(id: number, data: ProfileUpdateRequest) {
  return apiRequest("PATCH", `/api/users/${id}`, data);
}

// チーム関連
export async function getTeams() {
  const token = getAuthToken();
  if (!token) throw new Error("認証が必要です");
  
  const res = await fetch("/api/teams", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error("チーム情報の取得に失敗しました");
  }
  
  return res.json();
}

export async function getTeam(id: number) {
  const token = getAuthToken();
  if (!token) throw new Error("認証が必要です");
  
  const res = await fetch(`/api/teams/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error("チーム情報の取得に失敗しました");
  }
  
  return res.json();
}

// カード関連
export async function getCards(options: {
  limit?: number;
  offset?: number;
  senderId?: number;
  recipientId?: number;
} = {}) {
  const token = getAuthToken();
  if (!token) throw new Error("認証が必要です");
  
  console.log("getCards呼び出し - オプション:", options);
  console.log("認証トークン:", token ? "トークンあり" : "トークンなし");
  
  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.append("limit", options.limit.toString());
  if (options.offset) queryParams.append("offset", options.offset.toString());
  if (options.senderId) queryParams.append("senderId", options.senderId.toString());
  if (options.recipientId) queryParams.append("recipientId", options.recipientId.toString());
  
  const url = `/api/cards${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  console.log("カード取得リクエストURL:", url);
  
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    console.log("カード取得レスポンス:", res.status, res.statusText);
    
    if (!res.ok) {
      console.error("カード取得エラー:", res.status, res.statusText);
      throw new Error(`カード情報の取得に失敗しました: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log("取得したカードデータ:", data);
    return data;
  } catch (error) {
    console.error("カード取得例外:", error);
    throw error;
  }
}

export async function getCard(id: number) {
  const token = getAuthToken();
  if (!token) throw new Error("認証が必要です");
  
  const res = await fetch(`/api/cards/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error("カード情報の取得に失敗しました");
  }
  
  return res.json();
}

export async function createCard(data: CardFormRequest) {
  return apiRequest("POST", "/api/cards", data);
}

// いいね関連
export async function createLike(data: LikeFormRequest) {
  return apiRequest("POST", "/api/likes", data);
}
