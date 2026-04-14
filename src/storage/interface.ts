import type { ProxyNode, SubscriptionSource } from '../core/types';

/**
 * 存储适配器接口
 * 抽象配置读取和缓存操作，支持不同运行时实现
 */
export interface StorageAdapter {
  /**
   * 获取订阅源配置
   */
  getSources(): Promise<SubscriptionSource[]>;

  /**
   * 获取手动代理配置
   */
  getManualProxies(): Promise<ProxyNode[]>;

  /**
   * 从缓存获取节点
   * @param key 缓存键（订阅 URL）
   */
  getCache(key: string): Promise<ProxyNode[] | null>;

  /**
   * 将节点存入缓存
   * @param key 缓存键
   * @param nodes 节点列表
   * @param ttlDays 缓存有效期（天）
   */
  setCache(key: string, nodes: ProxyNode[], ttlDays: number): Promise<void>;
}
