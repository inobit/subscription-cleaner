import { Hono } from 'hono';
import { WorkerStorage } from './storage/worker';
import { createSubscriptionRouter } from './routes/subscription-worker';
import type { WorkerEnv } from './config-worker';

export interface WorkerContext {
  storage: WorkerStorage;
}

declare module 'hono' {
  interface ContextVariableMap {
    storage: WorkerStorage;
  }
}

const app = new Hono();

// 注入存储实例
app.use('*', async (c, next) => {
  const env = c.env as WorkerEnv;
  const storage = new WorkerStorage(env.SUBSCRIPTION_KV);
  c.set('storage', storage);
  await next();
});

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: 'worker-1.0.0',
  });
});

// 订阅路由
app.route('/subscription', createSubscriptionRouter());

export default app;
