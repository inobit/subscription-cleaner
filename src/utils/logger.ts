import pino from 'pino';
import { config } from '../config.ts';

/**
 * Pino 日志实例
 * 开发环境使用 pretty 格式，生产环境使用 JSON
 */
export const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    env: config.nodeEnv,
  },
});

/**
 * 创建子日志器，用于标识模块来源
 * @param module 模块名称
 */
export function createChildLogger(module: string) {
  return logger.child({ module });
}
