import { decodeBase64 } from './base64.ts';

/** 分享链接的 scheme 前缀，如 vless://、trojan:// */
const URI_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * 内容是否为“裸分享链接”行（未经 Base64 编码）
 * @param content 待检测内容
 * @returns 首个非空行以 scheme:// 开头时为 true
 */
export function isRawUriContent(content: string): boolean {
  const firstLine = content.trim().split(/\s+/)[0] ?? '';
  return URI_SCHEME.test(firstLine);
}

/**
 * 把订阅内容拆成分享链接行
 * 兼容两种上游格式：裸分享链接（每行一条）、Base64 编码的分享链接（v2rayN 默认）
 * @param content 订阅原文
 * @returns 分享链接行数组（解码失败时为空数组）
 */
export function splitUriLines(content: string): string[] {
  const text = isRawUriContent(content) ? content : decodeBase64(content);
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * 从分享链接中取出 scheme（小写）
 * @param uri 分享链接
 * @returns 形如 vless，无 scheme 时返回空字符串
 */
export function getUriScheme(uri: string): string {
  return uri.trim().match(URI_SCHEME)?.[0].slice(0, -3).toLowerCase() ?? '';
}
