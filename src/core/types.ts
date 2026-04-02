/**
 * 代理节点基础类型
 * 支持多种代理协议的通用字段
 */
export interface ProxyNode {
  /** 节点名称 */
  name: string;
  /** 协议类型: vmess, ss, trojan, http, socks5 等 */
  type: string;
  /** 服务器地址 */
  server: string;
  /** 服务器端口 */
  port: number;
  /** 其他协议特定字段 */
  [key: string]: unknown;
}

/**
 * Clash 配置格式
 */
export interface ClashConfig {
  /** 代理节点列表 */
  proxies: ProxyNode[];
  /** 其他配置项 */
  [key: string]: unknown;
}

/**
 * 订阅源配置
 */
export interface SubscriptionSource {
  /** 订阅标签 */
  tag: string;
  /** 订阅URL */
  url: string;
  /** 协议类型: clash, trojan, ss */
  protocol: 'clash' | 'trojan' | 'ss';
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 解析结果
 */
export interface ParseResult {
  /** 解析成功标志 */
  success: boolean;
  /** 解析出的节点列表 */
  nodes: ProxyNode[];
  /** 错误信息（失败时） */
  error?: string;
}

/**
 * 清洗配置
 */
export interface CleanConfig {
  /** 是否去重 */
  removeDuplicate: boolean;
  /** 重命名模板 */
  nameTemplate?: string;
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  /** 主题（用户标识） */
  sub: string;
  /** 过期时间（Unix时间戳） */
  exp: number;
}

/**
 * 应用配置
 */
export interface AppConfig {
  /** 运行环境 */
  nodeEnv: string;
  /** 服务端口 */
  port: number;
  /** JWT密钥 */
  jwtSecret: string;
  /** 日志级别 */
  logLevel: string;
  /** 资源目录 */
  resourcesDir: string;
}
