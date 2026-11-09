import type { StorageAdapter } from './interface';
import type { ManualProxyEntry, ProxyNode, SubscriptionSource } from '../core/types';

export class WorkerStorage implements StorageAdapter {
  constructor(private kv: KVNamespace) {}

  async getSources(): Promise<SubscriptionSource[]> {
    const config = await this.kv.get<{ sources: SubscriptionSource[] }>('config:sources', 'json');
    return config?.sources || [];
  }

  async getManualProxies(): Promise<ManualProxyEntry[]> {
    const config = await this.kv.get<{ proxies: ManualProxyEntry[] }>('config:proxies', 'json');
    const proxies = config?.proxies;
    if (!Array.isArray(proxies)) return [];

    // 条目允许是节点对象或分享链接字符串，其它类型（null/数字等）直接丢弃
    return proxies.filter(
      (entry): entry is ManualProxyEntry =>
        typeof entry === 'string' || (typeof entry === 'object' && entry !== null)
    );
  }

  async getCache(key: string): Promise<ProxyNode[] | null> {
    return await this.kv.get<ProxyNode[]>(`cache:${key}`, 'json');
  }

  async setCache(key: string, nodes: ProxyNode[], ttlDays: number): Promise<void> {
    const ttlSeconds = ttlDays * 24 * 60 * 60;
    await this.kv.put(`cache:${key}`, JSON.stringify(nodes), {
      expirationTtl: ttlSeconds,
    });
  }
}
