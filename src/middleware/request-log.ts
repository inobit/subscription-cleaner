import type { MiddlewareHandler } from 'hono';
import { createChildLogger } from '../utils/logger.ts';

const logger = createChildLogger('http');

/**
 * 请求日志中间件
 * 记录每个请求的方法和路径及响应时间
 */
export const requestLogMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  logger.info(`→ ${method} ${path}`);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info(`← ${method} ${path} ${status} ${duration}ms`);
};
