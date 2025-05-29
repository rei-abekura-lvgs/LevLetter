import { QueryClient } from "@tanstack/react-query";
import { getAuthToken } from "./auth";

// APIリクエスト時のエラーハンドリング用ヘルパー関数
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error: ${res.status} ${res.statusText}`);
    } else {
      const errorText = await res.text();
      throw new Error(errorText || `Error: ${res.status} ${res.statusText}`);
    }
  }
}

// API リクエスト関数
export async function apiRequest<T>(
  method: string,
  path: string,
  data?: any
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
  
  const config: RequestInit = {
    method,
    headers: {
      ...headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store'
  };
  
  // 認証が必要なパスへのリクエストで、トークンがない場合の早期チェック
  if (path.includes('/api/auth/me') && !token) {
    throw new Error('認証が必要です');
  }
  
  // キャッシュ回避のためURLにタイムスタンプを追加
  const timestampUrl = path + (path.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
  
  console.log(`API ${method} リクエスト:`, timestampUrl, data ? "データあり" : "データなし");
  
  try {
    const response = await fetch(timestampUrl, config);
    
    if (!response.ok) {
      // 401エラーを特別に処理
      if (response.status === 401) {
        if (path === '/api/auth/me') {
          // auth/meへのリクエストの401エラーはログインが必要なだけなので静かに処理
          console.log('ユーザーは未ログイン状態です');
          throw new Error('認証が必要です');
        } else {
          throw new Error('認証が必要です。ログインしてください。');
        }
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || `エラー: ${response.status} ${response.statusText}`);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `エラー: ${response.status} ${response.statusText}`);
      }
    }
    
    // 204 No Content の場合は空のオブジェクトを返す
    if (response.status === 204) {
      return {} as T;
    }
    
    // Content-Typeを確認してJSONレスポンスかどうかを判定
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const responseData = await response.json();
      return responseData as T;
    } else {
      // JSONでない場合（HTMLエラーページなど）はテキストとして取得
      const responseText = await response.text();
      console.warn(`非JSON レスポンス受信:`, path, responseText.substring(0, 200));
      // 成功ステータスの場合は空のオブジェクトを返す
      if (response.status >= 200 && response.status < 300) {
        return { message: "成功" } as T;
      }
      throw new Error(`予期しないレスポンス形式: ${response.status}`);
    }
  } catch (error) {
    // パスによって異なるエラーハンドリングを行う
    if (path === '/api/auth/me' && error instanceof Error && error.message.includes('認証')) {
      // 認証エラーはより静かに処理（デバッグレベルでログ）
      console.debug(`API ${method} 認証エラー:`, path);
    } else {
      // それ以外のエラーは通常通りログ出力
      console.error(`API ${method} エラー:`, path, error);
    }
    throw error;
  }
}

// クエリ関数ファクトリー
export const getQueryFn = <T>(options: {
  on401: "returnNull" | "throw";
}) => {
  return async (path: string): Promise<T | null> => {
    try {
      return await apiRequest<T>("GET", path);
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      
      // 認証エラー時の処理
      if (error instanceof Error && 
          error.message.includes("401") && 
          options.on401 === "returnNull") {
        return null;
      }
      
      throw error;
    }
  };
};

// TanStack Query クライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      queryFn: (context) => getQueryFn<unknown>({ on401: "throw" })(context.queryKey[0] as string),
    },
  },
});