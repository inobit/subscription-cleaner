import { Hono } from 'hono';
import subscriptionRouter from './subscription.ts';

const app = new Hono();

/**
 * 健康检查
 * GET /health
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 订阅相关路由
 * /subscription/*
 */
app.route('/subscription', subscriptionRouter);

export default app;
