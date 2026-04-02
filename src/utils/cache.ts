import type { ProxyNode } from '../core/types.ts';

interface CacheEntry {
  nodes: ProxyNode[];
  timestamp: number;
}

// 内存缓存存储
const cache = new Map<string, CacheEntry>();

// 默认缓存时间：30天（毫秒）
const DEFAULT_CACHE_TTL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 生成缓存键
 * @param url 订阅URL
 * @returns 缓存键
 */
export function getCacheKey(url: string): string {
  return `sub:${url}`;
}

/**
 * 从缓存获取节点
 * @param url 订阅URL
 * @param ttlDays 缓存有效期（天）
 * @returns 缓存的节点列表，未命中返回null
 */
export function getCachedNodes(url: string, ttlDays?: number): ProxyNode[] | null {
  const key = getCacheKey(url);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const effectiveTtlMs = (ttlDays ?? DEFAULT_CACHE_TTL_DAYS) * MS_PER_DAY;
  const now = Date.now();

  // 检查是否过期
  if (now - entry.timestamp > effectiveTtlMs) {
    cache.delete(key);
    return null;
  }

  return entry.nodes;
}

/**
 * 将节点存入缓存
 * @param url 订阅URL
 * @param nodes 节点列表
 */
export function setCachedNodes(url: string, nodes: ProxyNode[]): void {
  const key = getCacheKey(url);
  cache.set(key, {
    nodes,
    timestamp: Date.now(),
  });
}

/**
 * 清除指定URL的缓存
 * @param url 订阅URL
 */
export function clearCache(url: string): void {
  const key = getCacheKey(url);
  cache.delete(key);
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  cache.clear();
}
