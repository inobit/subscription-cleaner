import type { ManualProxyEntry, ProxyNode } from '../types.ts';
import { getUriScheme } from './uri-utils.ts';
import { parseVlessUri } from './vless.ts';

/** 日志接口（只用到 warn，避免 core 依赖 services 层） */
export interface NormalizeLogger {
  warn?: (msg: string) => void;
}

/**
 * 把单条分享链接解析为节点对象
 * @param uri 分享链接，如 vless://...
 * @returns 节点对象；scheme 不支持或链接非法时返回 null
 */
export function parseProxyUri(uri: string): ProxyNode | null {
  const scheme = getUriScheme(uri);
  switch (scheme) {
    case 'vless':
      return parseVlessUri(uri);
    default:
      return null;
  }
}

/**
 * 把手动代理配置（对象与分享链接混排）归一化为节点对象列表
 * 对象原样透传；分享链接解析为对象，解析失败的跳过并记日志
 * @param entries config:proxies 中的条目
 * @param logger 日志适配器（可选）
 * @returns 节点对象列表
 */
export function normalizeManualProxies(
  entries: ManualProxyEntry[],
  logger?: NormalizeLogger
): ProxyNode[] {
  const nodes: ProxyNode[] = [];

  for (const entry of entries) {
    if (typeof entry !== 'string') {
      nodes.push(entry);
      continue;
    }

    const uri = entry.trim();
    if (!uri) continue;

    const node = parseProxyUri(uri);
    if (node) {
      nodes.push(node);
      continue;
    }

    const scheme = getUriScheme(uri);
    const reason = scheme ? `不支持的分享链接格式: ${scheme}` : '无法识别的节点配置';
    logger?.warn?.(`跳过手动代理条目（${reason}）: ${truncate(uri)}`);
  }

  return nodes;
}

/**
 * 截断过长内容，避免日志刷屏（同时避免完整链接进日志）
 * @param value 原始字符串
 * @param max 最大保留长度
 * @returns 截断后的字符串
 */
function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
