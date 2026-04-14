import { Hono } from 'hono';
import * as yaml from 'js-yaml';
import { aggregateSubscriptions } from '../services/subscription-worker';
import { authMiddleware } from '../middleware/auth-worker';
import { createChildLogger } from '../utils/logger-worker';

const logger = createChildLogger('routes');

export function createSubscriptionRouter(): Hono {
  const router = new Hono();

  // 应用认证中间件
  router.use('*', authMiddleware);

  /**
   * GET /subscription
   * 获取清洗后的节点订阅
   */
  router.get('/', async (c) => {
    logger.info('收到订阅请求');

    const storage = c.get('storage');
    const sources = await storage.getSources();
    const manualNodes = await storage.getManualProxies();

    if (sources.length === 0 && manualNodes.length === 0) {
      return c.json({ error: '没有可用的订阅源配置或手动代理' }, 500);
    }

    const nodes = await aggregateSubscriptions(sources, manualNodes, storage);
    if (nodes.length === 0) {
      return c.json({ error: '没有可用的节点' }, 503);
    }

    // 返回 YAML 格式
    const output = yaml.dump({ proxies: nodes });
    c.header('Content-Type', 'text/plain; charset=utf-8');
    return c.body(output);
  });

  /**
   * GET /subscription/raw
   * 获取原始订阅内容
   */
  router.get('/raw', async (c) => {
    logger.info('收到原始订阅请求');

    const storage = c.get('storage');
    const sources = await storage.getSources();
    const firstEnabled = sources.find((s) => s.enabled);

    if (!firstEnabled) {
      return c.json({ error: '没有启用的订阅源' }, 503);
    }

    try {
      const response = await fetch(firstEnabled.url);
      const content = await response.text();
      c.header('Content-Type', 'text/plain; charset=utf-8');
      return c.body(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return c.json({ error: `获取原始订阅失败: ${message}` }, 500);
    }
  });

  return router;
}
