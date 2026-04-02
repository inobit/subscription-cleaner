import type { MiddlewareHandler } from 'hono';
import { verifyToken, extractToken } from '../utils/jwt.ts';
import { createChildLogger } from '../utils/logger.ts';

const logger = createChildLogger('auth');

/**
 * JWT认证中间件
 * 从Authorization头或Query参数验证JWT Token
 * 验证失败返回401
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('authorization');
  const queryToken = c.req.query('token');

  const token = extractToken(authHeader, queryToken);

  if (!token) {
    logger.warn('未提供认证Token');
    return c.json({ error: '未提供认证Token' }, 401);
  }

  try {
    const payload = verifyToken(token);
    // 将payload存入上下文，供后续使用
    c.set('jwtPayload', payload);
    logger.debug('Token验证成功');
    return await next();
  } catch (error) {
    const message = error instanceof Error ? error.message : '认证失败';
    logger.warn(`Token验证失败: ${message}`);
    return c.json({ error: `认证失败: ${message}` }, 401);
  }
};
