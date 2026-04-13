import type { Logger, CreateChildLogger } from './interface.ts';

/**
 * 日志级别
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Console 日志实现
 * 适配 Cloudflare Workers 环境
 */
class ConsoleLogger implements Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (args.length > 0) {
      console[level](prefix, message, ...args);
    } else {
      console[level](prefix, message);
    }
  }

  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args);
  }
}

/**
 * 创建 Console 日志实例
 * @param logLevel 日志级别
 * @returns 全局日志实例和子日志创建函数
 */
export function createConsoleLogger(logLevel: string): {
  logger: Logger;
  createChildLogger: CreateChildLogger;
} {
  const logger = new ConsoleLogger(logLevel as LogLevel);

  const createChildLogger: CreateChildLogger = (module: string) => {
    return {
      debug: (msg, ...args) => logger.debug(`[${module}] ${msg}`, ...args),
      info: (msg, ...args) => logger.info(`[${module}] ${msg}`, ...args),
      warn: (msg, ...args) => logger.warn(`[${module}] ${msg}`, ...args),
      error: (msg, ...args) => logger.error(`[${module}] ${msg}`, ...args),
    };
  };

  return { logger, createChildLogger };
}
