import { describe, it, expect, vi, afterEach } from 'vitest';
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
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('应携带默认请求头（UA/Accept），避免被订阅服务端拒绝', async () => {
      const fetchMock = vi.fn(async () => new Response('ok'));
      vi.stubGlobal('fetch', fetchMock);

      await fetchSubscription('https://example.com/sub');

      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      const headers = new Headers(init?.headers);
      expect(headers.get('User-Agent')).toContain('Mozilla');
      expect(headers.get('Accept')).toBe('*/*');
    });

    it('非 2xx 应抛出 HTTP 错误', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('err', { status: 500 })));
      await expect(fetchSubscription('https://example.com/sub')).rejects.toThrow('HTTP 500');
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
