import type { JWTPayload } from '../core/types';

/**
 * Base64 URL 编码
 */
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 URL 解码
 */
function base64UrlDecode(str: string): string {
  const padding = 4 - (str.length % 4);
  if (padding !== 4) {
    str += '='.repeat(padding);
  }
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(str);
}

/**
 * 导入 HMAC 密钥
 */
async function importKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * 生成 JWT Token
 */
export async function generateToken(secret: string, months: number = 3): Promise<string> {
  const key = await importKey(secret);
  const encoder = new TextEncoder();

  const now = Math.floor(Date.now() / 1000);
  const exp = now + months * 30 * 24 * 60 * 60;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JWTPayload = {
    sub: 'subscription-user',
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${encodedSignature}`;
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const key = await importKey(secret);
  const encoder = new TextEncoder();

  // 验证签名
  const signatureBytes = Uint8Array.from(
    atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0)
  );
  const data = `${encodedHeader}.${encodedPayload}`;
  const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(data));

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // 解析 payload
  const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

  // 检查过期时间
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
}

/**
 * 从请求中提取 Token
 */
export function extractToken(authHeader?: string, queryToken?: string): string | null {
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (queryToken) {
    return queryToken;
  }
  return null;
}
