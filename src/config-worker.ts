/**
 * Workers 环境变量类型
 */
export interface WorkerEnv {
  SUBSCRIPTION_KV: KVNamespace;
  /** 静态认证 Token（wrangler secret / Dashboard 设置） */
  AUTH_TOKEN: string;
  LOG_LEVEL?: string;
  [key: string]: unknown;
}

// 导出兼容 Hono 的 Env 类型
export type Env = WorkerEnv;
