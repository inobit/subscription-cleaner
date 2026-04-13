import { readFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { createChildLogger } from '../utils/logger.ts';
import { aggregateSubscriptions, processSource, type CacheAdapter, type Logger } from './shared.ts';
import { getCachedNodes, setCachedNodes } from '../utils/cache.ts';
import type { ProxyNode, SubscriptionSource } from '../core/types.ts';

const logger = createChildLogger('subscription');

// Node.js 内存缓存适配器
const nodeCacheAdapter: CacheAdapter = {
  get: (key: string, ttlDays?: number) => getCachedNodes(key, ttlDays),
  set: (key: string, nodes: ProxyNode[]) => setCachedNodes(key, nodes),
};

// 包装 logger 以匹配接口
const nodeLogger: Logger = {
  info: (msg: string) => logger.info(msg),
  error: (msg: string) => logger.error(msg),
  debug: (msg: string) => logger.debug(msg),
  warn: (msg: string) => logger.warn(msg),
};

/**
 * 聚合所有订阅源的节点（Node.js 版本）
 * @param sources 订阅源列表
 * @param manualNodes 手动配置的代理节点（可选，放在结果前面）
 * @returns 聚合并清洗后的节点列表
 */
export async function aggregateSubscriptionsWithCache(
  sources: SubscriptionSource[],
  manualNodes: ProxyNode[] = []
): Promise<ProxyNode[]> {
  return aggregateSubscriptions(sources, manualNodes, nodeCacheAdapter, nodeLogger);
}

/**
 * 处理单个订阅源（Node.js 版本）
 * @param source 订阅源配置
 * @returns 节点列表
 */
export async function processSourceWithCache(source: SubscriptionSource): Promise<ProxyNode[]> {
  return processSource(source, nodeCacheAdapter, nodeLogger);
}

/**
 * 加载手动配置的代理节点
 * @param resourcesDir 资源目录路径
 * @returns 手动代理节点列表，文件不存在返回空数组
 */
export async function loadManualProxies(resourcesDir: string): Promise<ProxyNode[]> {
  try {
    const filePath = join(resourcesDir, 'proxies.yaml');
    const content = await readFile(filePath, 'utf-8');
    const parsed = yaml.load(content) as { proxies?: ProxyNode[] };

    if (!parsed.proxies || !Array.isArray(parsed.proxies)) {
      logger.warn('proxies.yaml 中没有找到 proxies 列表');
      return [];
    }

    logger.info(`成功加载 ${parsed.proxies.length} 个手动代理节点`);
    return parsed.proxies;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      logger.debug('proxies.yaml 文件不存在，跳过手动代理加载');
      return [];
    }
    logger.error(`加载手动代理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return [];
  }
}

// 为了保持向后兼容，保留旧的函数名
export { aggregateSubscriptionsWithCache as aggregateSubscriptions };
export { processSourceWithCache as processSource };
