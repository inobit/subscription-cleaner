/**
 * 日志接口定义
 * 被 Node.js 和 Worker 环境共享
 */

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * 创建子日志器
 * @param module 模块名称
 * @returns 子日志器
 */
export type CreateChildLogger = (module: string) => Logger;
