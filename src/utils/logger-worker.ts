/**
 * 日志级别
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 简单的 console 日志实现
 * 适配 Cloudflare Workers 环境
 */
class Logger {
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
 * 全局日志实例
 */
export const logger = new Logger();

/**
 * 创建子日志器
 */
export function createChildLogger(module: string) {
  return {
    debug: (msg: string, ...args: unknown[]) => logger.debug(`[${module}] ${msg}`, ...args),
    info: (msg: string, ...args: unknown[]) => logger.info(`[${module}] ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) => logger.warn(`[${module}] ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) => logger.error(`[${module}] ${msg}`, ...args),
  };
}
