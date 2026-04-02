import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, extractToken } from '../../src/utils/jwt.ts';

describe('JWT Tools', () => {
  describe('generateToken', () => {
    it('应生成有效的JWT token', () => {
      const token = generateToken();
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('应支持自定义有效期', () => {
      const token1 = generateToken(1);
      const token6 = generateToken(6);
      expect(token1).toBeDefined();
      expect(token6).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('应验证有效的token', () => {
      const token = generateToken();
      const payload = verifyToken(token);
      expect(payload.sub).toBe('subscription-user');
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('应拒绝格式错误的token', () => {
      expect(() => verifyToken('invalid.token')).toThrow('Invalid token format');
    });

    it('应拒绝无效的签名', () => {
      const token = generateToken();
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered)).toThrow('Invalid signature');
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
