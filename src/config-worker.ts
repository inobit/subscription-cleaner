import type { AppConfig } from './core/types';

/**
 * Workers 环境变量类型
 */
export interface WorkerEnv {
  SUBSCRIPTION_KV: KVNamespace;
  JWT_SECRET: string;
  LOG_LEVEL?: string;
  [key: string]: unknown;
}

/**
 * 从环境变量创建配置
 */
export function createConfig(env: WorkerEnv): AppConfig {
  const config: AppConfig = {
    nodeEnv: 'production',
    port: 0, // Workers 不需要端口
    jwtSecret: env.JWT_SECRET,
    logLevel: env.LOG_LEVEL || 'info',
    resourcesDir: '', // Workers 不使用文件系统
  };

  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET 环境变量必须设置');
  }

  return config;
}

// 导出兼容 Hono 的 Env 类型
export type Env = WorkerEnv;
