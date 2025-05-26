import { CognitoIdentityProviderClient, InitiateAuthCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';

// AWS Cognito クライアント設定
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface CognitoUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}

/**
 * Google認証用のCognito Hosted UI URLを生成
 */
export function generateGoogleAuthUrl(redirectUri: string): string {
  const domain = process.env.AWS_COGNITO_DOMAIN;
  const clientId = process.env.AWS_COGNITO_CLIENT_ID;
  
  const params = new URLSearchParams({
    identity_provider: 'Google',
    redirect_uri: redirectUri,
    response_type: 'code',
    client_id: clientId!,
    scope: 'email openid profile',
  });

  return `https://${domain}/oauth2/authorize?${params.toString()}`;
}

/**
 * 認証コードをアクセストークンに交換
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const domain = process.env.AWS_COGNITO_DOMAIN;
  const clientId = process.env.AWS_COGNITO_CLIENT_ID;

  const tokenEndpoint = `https://${domain}/oauth2/token`;
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId!,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange failed:', error);
    throw new Error('トークン交換に失敗しました');
  }

  return await response.json();
}

/**
 * JWTトークンからユーザー情報を取得
 */
export function decodeIdToken(idToken: string): CognitoUser {
  const decoded = jwt.decode(idToken) as any;
  
  if (!decoded) {
    throw new Error('無効なIDトークンです');
  }

  return {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
    givenName: decoded.given_name,
    familyName: decoded.family_name,
    picture: decoded.picture,
  };
}

/**
 * 現在のReplitドメインを取得
 */
export function getCurrentDomain(req: Request): string {
  // Replitの場合は REPLIT_DOMAINS 環境変数から取得
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const domains = replitDomains.split(',');
    const hostname = req.get('host');
    const matchingDomain = domains.find(domain => hostname?.includes(domain));
    if (matchingDomain) {
      return `https://${matchingDomain}`;
    }
  }
  
  // フォールバック: リクエストのホスト情報から構築
  const protocol = req.secure ? 'https' : 'http';
  const host = req.get('host');
  return `${protocol}://${host}`;
}

/**
 * リダイレクトURIを生成
 */
export function getRedirectUri(req: Request): string {
  const domain = getCurrentDomain(req);
  return `${domain}/auth/callback`;
}