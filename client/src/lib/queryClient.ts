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
    headers,
    body: data ? JSON.stringify(data) : undefined
  };
  
  console.log(`API ${method} リクエスト:`, path, data ? "データあり" : "データなし");
  
  try {
    const response = await fetch(path, config);
    
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
      }
    }
    
    // 204 No Content の場合は空のオブジェクトを返す
    if (response.status === 204) {
      return {} as T;
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API ${method} エラー:`, path, error);
    throw error;
  }
}

// クエリ関数ファクトリー
export const getQueryFn = <T>(options: {
  on401: "returnNull" | "throw";
}) => {
  return async (path: string): Promise<T | null> => {
    try {
      const response = await apiRequest(path);
      
      if (response.status === 401 && options.on401 === "returnNull") {
        return null;
      }
      
      await throwIfResNotOk(response);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
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