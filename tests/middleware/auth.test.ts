import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware, safeEqual, extractToken } from '../../src/middleware/auth-worker';

const TEST_TOKEN = 'test-auth-token-for-unit-tests-only';

describe('Auth Middleware (Worker)', () => {
  const createApp = (env: Record<string, unknown> = { AUTH_TOKEN: TEST_TOKEN }) => {
    const app = new Hono();
    app.get('/protected', authMiddleware, (ctx) => ctx.json({ message: 'success' }));
    // Hono 的 request(path, init, env) 第三个参数即为 Workers env
    return {
      request: (path: string, init?: RequestInit) => app.request(path, init, env),
    };
  };

  it('应拒绝无Token的请求', async () => {
    const res = await createApp().request('/protected');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('未提供认证 Token');
  });

  it('应接受有效的Bearer Token', async () => {
    const res = await createApp().request('/protected', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(res.status).toBe(200);
  });

  it('应接受有效的Query Token', async () => {
    const res = await createApp().request(`/protected?token=${TEST_TOKEN}`);
    expect(res.status).toBe(200);
  });

  it('应拒绝错误的Token', async () => {
    const res = await createApp().request('/protected', {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(res.status).toBe(401);
  });

  it('应拒绝前缀匹配但长度不同的Token', async () => {
    const res = await createApp().request(`/protected?token=${TEST_TOKEN}x`);
    expect(res.status).toBe(401);
  });

  it('服务端未配置AUTH_TOKEN时应返回500，不放行', async () => {
    const res = await createApp({}).request('/protected?token=anything');
    expect(res.status).toBe(500);
  });

  it('服务端AUTH_TOKEN为空串时不应被空Token绕过', async () => {
    const res = await createApp({ AUTH_TOKEN: '' }).request('/protected?token=');
    expect(res.status).toBe(500);
  });
});

describe('safeEqual', () => {
  it('相同字符串返回 true', async () => {
    expect(await safeEqual('abc', 'abc')).toBe(true);
  });

  it('不同字符串返回 false', async () => {
    expect(await safeEqual('abc', 'abd')).toBe(false);
  });

  it('长度不同返回 false', async () => {
    expect(await safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('extractToken', () => {
  it('优先使用 Bearer header', () => {
    expect(extractToken('Bearer h', 'q')).toBe('h');
  });

  it('无 header 时使用 query', () => {
    expect(extractToken(undefined, 'q')).toBe('q');
  });

  it('都没有时返回 null', () => {
    expect(extractToken(undefined, undefined)).toBeNull();
    expect(extractToken(undefined, '')).toBeNull();
  });
});
