import { Hono } from 'hono';
import * as yaml from 'js-yaml';
import { aggregateSubscriptions } from '../services/subscription.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { createChildLogger } from '../utils/logger.ts';
import type { SubscriptionSource } from '../core/types.ts';
import { config } from '../config.ts';
import { readFile } from 'fs/promises';
import { join } from 'path';

const logger = createChildLogger('routes');
const subscriptionRouter = new Hono();

/**
 * 加载订阅源配置
 */
async function loadSources(): Promise<SubscriptionSource[]> {
  try {
    const configPath = join(config.resourcesDir, 'sources.yaml');
    const content = await readFile(configPath, 'utf-8');
    const parsed = yaml.load(content) as { sources: SubscriptionSource[] };
    return parsed.sources || [];
  } catch (error) {
    logger.error(`加载订阅源配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return [];
  }
}

// 应用认证中间件
subscriptionRouter.use('*', authMiddleware);

/**
 * GET /subscription
 * 获取清洗后的节点订阅
 */
subscriptionRouter.get('/', async (c) => {
  logger.info('收到订阅请求');

  const sources = await loadSources();
  if (sources.length === 0) {
    return c.json({ error: '没有可用的订阅源配置' }, 500);
  }

  const nodes = await aggregateSubscriptions(sources);
  if (nodes.length === 0) {
    return c.json({ error: '没有可用的节点' }, 503);
  }

  // 返回YAML格式
  const output = yaml.dump({ proxies: nodes });
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.body(output);
});

/**
 * GET /subscription/raw
 * 获取原始订阅内容（可选）
 */
subscriptionRouter.get('/raw', async (c) => {
  logger.info('收到原始订阅请求');

  const sources = await loadSources();
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

export default subscriptionRouter;
