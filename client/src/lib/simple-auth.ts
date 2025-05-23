import { User } from "@shared/schema";

// シンプルな認証システム
export async function simpleLogin(email: string, password: string): Promise<User> {
  const response = await fetch('/api/auth/simple-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // セッションクッキーを含める
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'ログインに失敗しました');
  }

  const data = await response.json();
  return data.user;
}

export async function simpleGetUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/simple-me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}

export async function simpleLogout(): Promise<void> {
  await fetch('/api/auth/simple-logout', {
    method: 'POST',
    credentials: 'include',
  });
}