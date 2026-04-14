import { createChildLogger } from '../utils/logger-worker';
import {
  aggregateSubscriptions as aggregateSubscriptionsInternal,
  processSource as processSourceInternal,
  fetchSubscription,
  getParser,
  type CacheAdapter,
  type Logger,
} from './shared';
import type { ProxyNode, SubscriptionSource } from '../core/types';
import type { StorageAdapter } from '../storage/interface';

const logger = createChildLogger('subscription');

// Worker KV 缓存适配器
function createCacheAdapter(storage: StorageAdapter): CacheAdapter {
  return {
    get: async (key: string) => storage.getCache(key),
    set: async (key: string, nodes: ProxyNode[]) => {
      // 默认 30 天 TTL
      await storage.setCache(key, nodes, 30);
    },
  };
}

// Worker 日志适配器
const workerLogger: Logger = {
  info: (msg: string) => logger.info(msg),
  error: (msg: string) => logger.error(msg),
  debug: (msg: string) => logger.debug(msg),
  warn: (msg: string) => logger.warn(msg),
};

/**
 * 聚合所有订阅源的节点（Worker 版本）
 * @param sources 订阅源列表
 * @param manualNodes 手动配置的代理节点
 * @param storage 存储适配器
 * @returns 聚合并清洗后的节点列表
 */
export async function aggregateSubscriptions(
  sources: SubscriptionSource[],
  manualNodes: ProxyNode[] = [],
  storage: StorageAdapter
): Promise<ProxyNode[]> {
  const cacheAdapter = createCacheAdapter(storage);
  return aggregateSubscriptionsInternal(sources, manualNodes, cacheAdapter, workerLogger);
}

/**
 * 处理单个订阅源（Worker 版本）
 * @param source 订阅源配置
 * @param storage 存储适配器
 * @returns 节点列表
 */
export async function processSource(
  source: SubscriptionSource,
  storage: StorageAdapter
): Promise<ProxyNode[]> {
  const cacheAdapter = createCacheAdapter(storage);
  return processSourceInternal(source, cacheAdapter, workerLogger);
}

// 导出共享函数
export { fetchSubscription, getParser };
export type { ProxyNode, SubscriptionSource };
