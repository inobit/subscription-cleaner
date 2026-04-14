import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../../src/middleware/auth-worker';
import { generateToken } from '../../src/utils/jwt-worker';

const TEST_SECRET = 'test-secret-key-for-unit-tests-only';

describe('Auth Middleware (Worker)', () => {
  const createApp = () => {
    const app = new Hono();
    // Worker auth middleware 需要从 env 读取 JWT_SECRET
    // 这里简化测试，直接测试中间件逻辑
    app.use('/protected', (c, next) => {
      // 设置 mock env
      c.env = { JWT_SECRET: TEST_SECRET };
      return authMiddleware(c, next);
    });
    app.get('/protected', (c) => c.json({ message: 'success' }));
    return app;
  };

  it('应拒绝无Token的请求', async () => {
    const app = createApp();
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('未提供认证 Token');
  });

  it('应接受有效的Bearer Token', async () => {
    const app = createApp();
    const token = await generateToken(TEST_SECRET);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it('应接受有效的Query Token', async () => {
    const app = createApp();
    const token = await generateToken(TEST_SECRET);
    const res = await app.request(`/protected?token=${token}`);
    expect(res.status).toBe(200);
  });

  it('应拒绝无效的Token', async () => {
    const app = createApp();
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(res.status).toBe(401);
  });
});
