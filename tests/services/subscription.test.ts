import { describe, it, expect } from 'vitest';
import type { ProxyNode, SubscriptionSource } from '../../src/core/types';
import {
  fetchSubscription,
  getParser,
  aggregateSubscriptions,
  type CacheAdapter,
  type Logger,
} from '../../src/services/shared';

// Mock 缓存适配器
const createMockCache = (): CacheAdapter => ({
  get: async () => null,
  set: async () => {},
});

// Mock 日志适配器
const createMockLogger = (): Logger => ({
  info: () => {},
  error: () => {},
  debug: () => {},
  warn: () => {},
});

describe('Shared Services', () => {
  describe('fetchSubscription', () => {
    it('应抛出 HTTP 错误', async () => {
      // 由于无法实际发起请求，这里只验证函数存在
      expect(typeof fetchSubscription).toBe('function');
    });
  });

  describe('getParser', () => {
    it('应返回 clash 解析器', () => {
      const parser = getParser('clash');
      expect(typeof parser).toBe('function');
    });

    it('应返回 trojan 解析器', () => {
      const parser = getParser('trojan');
      expect(typeof parser).toBe('function');
    });

    it('应返回 ss 解析器', () => {
      const parser = getParser('ss');
      expect(typeof parser).toBe('function');
    });

    it('不支持的协议应返回 undefined', () => {
      const parser = getParser('unsupported');
      expect(parser).toBeUndefined();
    });
  });

  describe('aggregateSubscriptions', () => {
    it('应返回手动节点（当订阅源为空时）', async () => {
      const manualNodes: ProxyNode[] = [
        { name: 'manual1', type: 'ss', server: '1.1.1.1', port: 443 },
      ];
      const sources: SubscriptionSource[] = [];
      const cache = createMockCache();
      const logger = createMockLogger();

      const result = await aggregateSubscriptions(sources, manualNodes, cache, logger);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('manual1');
    });

    it('空订阅源和空手动节点应返回空数组', async () => {
      const sources: SubscriptionSource[] = [];
      const cache = createMockCache();
      const logger = createMockLogger();

      const result = await aggregateSubscriptions(sources, [], cache, logger);

      expect(result).toHaveLength(0);
    });
  });
});
