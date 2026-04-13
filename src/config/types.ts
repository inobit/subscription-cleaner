/**
 * 统一配置类型定义
 * 被 Node.js 和 Worker 环境共享
 */

import type { SubscriptionSource, ProxyNode } from '../core/types.ts';

/**
 * 存储适配器接口
 * 抽象配置读取和缓存操作
 */
export interface StorageAdapter {
  /**
   * 获取订阅源配置
   */
  getSources(): Promise<SubscriptionSource[]>;

  /**
   * 获取手动代理配置
   */
  getManualProxies(): Promise<ProxyNode[]>;

  /**
   * 从缓存获取节点
   * @param key 缓存键（订阅 URL）
   */
  getCache(key: string): Promise<ProxyNode[] | null>;

  /**
   * 将节点存入缓存
   * @param key 缓存键
   * @param nodes 节点列表
   * @param ttlDays 缓存有效期（天）
   */
  setCache(key: string, nodes: ProxyNode[], ttlDays: number): Promise<void>;
}

/**
 * 日志接口
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * 子日志创建函数类型
 */
export type CreateChildLogger = (module: string) => Logger;

/**
 * JWT 服务接口
 */
export interface JWTService {
  /**
   * 生成 JWT Token
   * @param secret JWT 密钥
   * @param months 有效期月数
   */
  generateToken(secret: string, months?: number): Promise<string> | string;

  /**
   * 验证 JWT Token
   * @param token JWT Token
   * @param secret JWT 密钥
   */
  verifyToken(
    token: string,
    secret: string
  ): Promise<{ sub: string; exp: number }> | { sub: string; exp: number };

  /**
   * 从请求中提取 Token
   * @param authHeader Authorization 头
   * @param queryToken Query 参数中的 token
   */
  extractToken(authHeader?: string, queryToken?: string): string | null;
}

/**
 * 应用配置
 */
export interface AppConfig {
  /** 运行环境 */
  nodeEnv: string;
  /** 服务端口 (Node.js 使用) */
  port: number;
  /** JWT 密钥 */
  jwtSecret: string;
  /** 日志级别 */
  logLevel: string;
  /** 资源目录 (Node.js 使用) */
  resourcesDir: string;
}

/**
 * 服务上下文
 * 包含所有环境特定的依赖
 */
export interface ServiceContext {
  /** 应用配置 */
  config: AppConfig;
  /** 存储适配器 */
  storage: StorageAdapter;
  /** 日志创建器 */
  createChildLogger: CreateChildLogger;
  /** JWT 服务 */
  jwtService: JWTService;
}
