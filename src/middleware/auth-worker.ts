import type { MiddlewareHandler } from 'hono';
import { createChildLogger } from '../utils/logger-worker';
import type { WorkerEnv } from '../config-worker';

const logger = createChildLogger('auth');

/**
 * 常量时间字符串比较
 *
 * 先对两侧做 SHA-256 得到定长摘要，再逐字节异或累积差异，
 * 避免因长度或前缀匹配程度不同而产生时序差异。
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) {
    diff |= va[i] ^ vb[i];
  }
  return diff === 0;
}

/**
 * 从请求中提取 Token（优先 Authorization: Bearer，其次 ?token=）
 */
export function extractToken(authHeader?: string, queryToken?: string): string | null {
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return queryToken || null;
}

/**
 * 静态 Token 认证中间件
 */
export const authMiddleware: MiddlewareHandler = async (ctx, next) => {
  const env = ctx.env as WorkerEnv;
  const expected = env.AUTH_TOKEN;

  if (!expected) {
    logger.error('AUTH_TOKEN is not configured');
    return ctx.json({ error: '服务端未配置认证 Token' }, 500);
  }

  const token = extractToken(ctx.req.header('authorization'), ctx.req.query('token'));

  if (!token) {
    logger.warn('Missing auth token');
    return ctx.json({ error: '未提供认证 Token' }, 401);
  }

  if (!(await safeEqual(token, expected))) {
    logger.warn('Invalid auth token');
    return ctx.json({ error: '认证失败' }, 401);
  }

  return next();
};
