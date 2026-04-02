import type { AppConfig } from './core/types.ts';
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

/**
 * 从环境变量读取配置
 * 提供默认值并验证必填项
 */
export function loadConfig(): AppConfig {
  const config: AppConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    jwtSecret: process.env.JWT_SECRET || '',
    logLevel: process.env.LOG_LEVEL || 'info',
    resourcesDir: process.env.RESOURCES_DIR || './resources',
  };

  // 生产环境必须设置 JWT_SECRET
  if (config.nodeEnv === 'production' && !config.jwtSecret) {
    throw new Error('生产环境必须设置 JWT_SECRET 环境变量');
  }

  // 开发环境使用默认密钥
  if (!config.jwtSecret) {
    config.jwtSecret = 'dev-secret-key-do-not-use-in-production';
  }

  return config;
}

/**
 * 全局配置实例
 */
export const config = loadConfig();
