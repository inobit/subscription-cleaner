import { createHmac } from 'crypto';
import { config } from '../config.ts';
import type { JWTPayload } from '../core/types.ts';

/**
 * Base64 URL 编码（去除等号和替换特殊字符）
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL 解码
 */
function base64UrlDecode(str: string): string {
  // 还原 base64 标准格式
  const padding = 4 - (str.length % 4);
  if (padding !== 4) {
    str += '='.repeat(padding);
  }
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str, 'base64').toString();
}

/**
 * 生成 JWT Token
 * @param months 有效期月数（默认3个月）
 * @returns JWT Token字符串
 */
export function generateToken(months: number = 3): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + months * 30 * 24 * 60 * 60; // 按30天/月计算

  const payload: JWTPayload = {
    sub: 'subscription-user',
    exp,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = createHmac('sha256', config.jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64');
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * 验证 JWT Token
 * @param token JWT Token
 * @returns 验证通过返回payload，失败抛出错误
 */
export function verifyToken(token: string): JWTPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  // 验证签名
  const expectedSignature = createHmac('sha256', config.jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64');

  if (base64UrlEncode(expectedSignature) !== encodedSignature) {
    throw new Error('Invalid signature');
  }

  // 解析payload
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
 * 支持 Authorization Header 和 Query 参数
 * @param authHeader Authorization头
 * @param queryToken Query参数中的token
 * @returns Token或null
 */
export function extractToken(authHeader?: string, queryToken?: string): string | null {
  // 优先从 Header 提取
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // 其次从 Query 参数提取
  if (queryToken) {
    return queryToken;
  }
  return null;
}
