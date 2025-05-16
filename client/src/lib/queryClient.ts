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
export async function apiRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getAuthToken();
  
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  
  const response = await fetch(path, {
    ...init,
    headers,
  });
  
  return response;
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