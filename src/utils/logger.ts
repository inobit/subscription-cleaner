import pino from 'pino';
import { config } from '../config.ts';

/**
 * 创建 transport 配置
 * 开发环境: 仅输出到 stdout (pretty 格式)
 * 生产环境: 同时输出到 stdout (单行) 和文件 (JSON 轮转)
 */
function createTransport() {
  if (config.nodeEnv === 'development') {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname,module',
      },
    };
  }

  // 生产环境：多目标输出
  return {
    targets: [
      {
        target: 'pino-pretty',
        level: config.logLevel,
        options: {
          colorize: false,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname,module',
        },
      },
      {
        target: 'pino-roll',
        level: config.logLevel,
        options: {
          file: './logs/app',
          extension: '.log',
          frequency: 'daily', // 按天轮转
          dateFormat: 'yyyy-MM-dd', // 日期格式: app-2026-04-02.log
          mkdir: true,
          size: '10m', // 单个文件最大 10MB
          limit: { count: 30 }, // 保留最近 30 个文件
        },
      },
    ],
  };
}

/**
 * Pino 日志实例
 */
export const logger = pino({
  level: config.logLevel,
  transport: createTransport(),
  base: undefined,
});

/**
 * 创建子日志器，用于标识模块来源
 * @param module 模块名称
 */
export function createChildLogger(module: string) {
  return logger.child({ module }, { msgPrefix: `[${module}] ` });
}
