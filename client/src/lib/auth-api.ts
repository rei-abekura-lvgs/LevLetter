// 新しい認証API関数
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  displayName?: string | null;
  department?: string | null;
  emailVerified?: boolean;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: Pick<AuthUser, 'id' | 'email' | 'name'>;
}

// ログイン
export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'ログインに失敗しました');
  }

  const data: LoginResponse = await response.json();
  return data.user;
}

// 新規登録
export async function register(email: string, password: string, name: string, department?: string): Promise<RegisterResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name, department }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '登録に失敗しました');
  }

  return await response.json();
}

// 現在のユーザー情報取得
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return null;
  }
}

// ログアウト
export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('ログアウトに失敗しました');
  }
}

// パスワードリセット要求
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch('/api/auth/password-reset-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'パスワードリセット要求に失敗しました');
  }
}

// パスワードリセット実行
export async function resetPassword(token: string, password: string): Promise<void> {
  const response = await fetch('/api/auth/password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'パスワードリセットに失敗しました');
  }
}

// パスワード変更
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'パスワード変更に失敗しました');
  }
}

// メール認証
export async function verifyEmail(token: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'メール認証に失敗しました');
  }

  const data = await response.json();
  return data.user;
}