import { QueryClient } from "@tanstack/react-query";
import { getAuthToken } from "./auth";

// APIレスポンスをチェックする関数
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = "";
    try {
      const errorResponse = await res.json();
      errorText = errorResponse.message || errorResponse.error || res.statusText;
    } catch (e) {
      errorText = res.statusText;
    }
    throw new Error(errorText);
  }
}

// API呼び出しのための基本的な関数
export async function apiRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

// QueryKeyの型と401エラーの処理方法
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (path: string) => Promise<T> = ({ on401 }) => {
  return async (path: string) => {
    const res = await apiRequest(path);
    
    // 401エラーの場合
    if (res.status === 401) {
      if (on401 === "returnNull") {
        return null as unknown as T;
      } else {
        throw new Error("認証が必要です");
      }
    }

    await throwIfResNotOk(res);
    return res.json();
  };
};

// QueryClientの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1分
      queryFn: getQueryFn<unknown>({ on401: "throw" }),
    },
  },
});