import type { MiddlewareHandler } from 'hono';
import { verifyToken, extractToken } from '../utils/jwt-worker';
import { createChildLogger } from '../utils/logger-worker';
import type { WorkerEnv } from '../config-worker';

const logger = createChildLogger('auth');

/**
 * JWT 认证中间件
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const queryToken = c.req.query('token');

  const token = extractToken(authHeader, queryToken);

  if (!token) {
    logger.warn('未提供认证 Token');
    return c.json({ error: '未提供认证 Token' }, 401);
  }

  try {
    const env = c.env as WorkerEnv;
    const payload = await verifyToken(token, env.JWT_SECRET);
    c.set('jwtPayload', payload);
    logger.debug('Token 验证成功');
    await next();
  } catch (error) {
    const message = error instanceof Error ? error.message : '认证失败';
    logger.warn(`Token 验证失败: ${message}`);
    return c.json({ error: `认证失败: ${message}` }, 401);
  }
};

declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: { sub: string; exp: number };
  }
}
