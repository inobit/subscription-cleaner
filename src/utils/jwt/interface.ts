/**
 * JWT 接口定义
 * 被 Node.js 和 Worker 环境共享
 */

export interface JWTPayload {
  /** 主题（用户标识） */
  sub: string;
  /** 过期时间（Unix时间戳） */
  exp: number;
}

/**
 * JWT 服务接口
 */
export interface JWTService {
  /**
   * 生成 JWT Token
   * @param secret JWT 密钥
   * @param months 有效期月数（默认3个月）
   * @returns JWT Token 字符串
   */
  generateToken(secret: string, months?: number): Promise<string> | string;

  /**
   * 验证 JWT Token
   * @param token JWT Token
   * @param secret JWT 密钥
   * @returns 验证通过的 payload
   * @throws 验证失败抛出错误
   */
  verifyToken(token: string, secret: string): Promise<JWTPayload> | JWTPayload;

  /**
   * 从请求中提取 Token
   * @param authHeader Authorization 头
   * @param queryToken Query 参数中的 token
   * @returns Token 或 null
   */
  extractToken(authHeader?: string, queryToken?: string): string | null;
}
