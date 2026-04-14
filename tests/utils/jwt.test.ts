import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, extractToken } from '../../src/utils/jwt-worker';

const TEST_SECRET = 'test-secret-key-for-unit-tests-only';

describe('JWT Tools (Worker)', () => {
  describe('generateToken', () => {
    it('应生成有效的JWT token', async () => {
      const token = await generateToken(TEST_SECRET);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('应支持自定义有效期', async () => {
      const token1 = await generateToken(TEST_SECRET, 1);
      const token6 = await generateToken(TEST_SECRET, 6);
      expect(token1).toBeDefined();
      expect(token6).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('应验证有效的token', async () => {
      const token = await generateToken(TEST_SECRET);
      const payload = await verifyToken(token, TEST_SECRET);
      expect(payload.sub).toBe('subscription-user');
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('应拒绝格式错误的token', async () => {
      await expect(verifyToken('invalid.token', TEST_SECRET)).rejects.toThrow(
        'Invalid token format'
      );
    });

    it('应拒绝无效的签名', async () => {
      const token = await generateToken(TEST_SECRET);
      const tampered = token.slice(0, -5) + 'XXXXX';
      await expect(verifyToken(tampered, TEST_SECRET)).rejects.toThrow('Invalid signature');
    });
  });

  describe('extractToken', () => {
    it('应从Authorization头提取Bearer token', () => {
      const token = extractToken('Bearer my-token-123');
      expect(token).toBe('my-token-123');
    });

    it('应从Query参数提取token', () => {
      const token = extractToken(undefined, 'query-token-456');
      expect(token).toBe('query-token-456');
    });

    it('应优先使用Authorization头', () => {
      const token = extractToken('Bearer header-token', 'query-token');
      expect(token).toBe('header-token');
    });

    it('无token时应返回null', () => {
      const token = extractToken(undefined, undefined);
      expect(token).toBeNull();
    });
  });
});
