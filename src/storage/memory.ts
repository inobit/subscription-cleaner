import type { StorageAdapter } from '../config/types.ts';
import type { ProxyNode, SubscriptionSource } from '../core/types.ts';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'js-yaml';

interface CacheEntry {
  nodes: ProxyNode[];
  timestamp: number;
}

/**
 * Node.js 内存存储适配器
 * 使用内存 Map 存储缓存，从文件系统读取配置
 */
export class MemoryStorage implements StorageAdapter {
  private cache = new Map<string, CacheEntry>();
  private resourcesDir: string;

  // 默认缓存时间：30天（毫秒）
  private static readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  constructor(resourcesDir: string) {
    this.resourcesDir = resourcesDir;
  }

  /**
   * 从 sources.yaml 加载订阅源配置
   */
  async getSources(): Promise<SubscriptionSource[]> {
    try {
      const configPath = join(this.resourcesDir, 'sources.yaml');
      const content = await readFile(configPath, 'utf-8');
      const parsed = yaml.load(content) as { sources?: SubscriptionSource[] };
      return parsed.sources || [];
    } catch (error) {
      // 文件不存在或其他错误返回空数组
      return [];
    }
  }

  /**
   * 从 proxies.yaml 加载手动代理配置
   */
  async getManualProxies(): Promise<ProxyNode[]> {
    try {
      const filePath = join(this.resourcesDir, 'proxies.yaml');
      const content = await readFile(filePath, 'utf-8');
      const parsed = yaml.load(content) as { proxies?: ProxyNode[] };
      return parsed.proxies || [];
    } catch (error) {
      // 文件不存在返回空数组
      return [];
    }
  }

  /**
   * 从内存缓存获取节点
   */
  async getCache(key: string): Promise<ProxyNode[] | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    return entry.nodes;
  }

  /**
   * 将节点存入内存缓存
   * @param ttlDays 缓存有效期（天）
   */
  async setCache(key: string, nodes: ProxyNode[], ttlDays: number): Promise<void> {
    this.cache.set(key, {
      nodes,
      timestamp: Date.now(),
    });

    // 设置过期清理（简单实现，不精确）
    const ttlMs = ttlDays * MemoryStorage.MS_PER_DAY;
    setTimeout(() => {
      const entry = this.cache.get(key);
      if (entry && Date.now() - entry.timestamp > ttlMs) {
        this.cache.delete(key);
      }
    }, ttlMs);
  }
}
