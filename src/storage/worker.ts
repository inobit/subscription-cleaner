import type { StorageAdapter } from './interface';
import type { ProxyNode, SubscriptionSource } from '../core/types';

export class WorkerStorage implements StorageAdapter {
  constructor(private kv: KVNamespace) {}

  async getSources(): Promise<SubscriptionSource[]> {
    const config = await this.kv.get<{ sources: SubscriptionSource[] }>('config:sources', 'json');
    return config?.sources || [];
  }

  async getManualProxies(): Promise<ProxyNode[]> {
    const config = await this.kv.get<{ proxies: ProxyNode[] }>('config:proxies', 'json');
    return config?.proxies || [];
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
