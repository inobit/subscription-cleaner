import * as yaml from 'js-yaml';
import type { ClashConfig, ProxyNode, ParseResult } from '../types.ts';

/**
 * 解析Clash YAML格式的订阅内容
 * @param content YAML格式的订阅内容
 * @returns 解析结果
 */
export function parseClash(content: string): ParseResult {
  try {
    const config = yaml.load(content) as ClashConfig;

    if (!config || typeof config !== 'object') {
      return { success: false, nodes: [], error: '无效的YAML格式' };
    }

    if (!Array.isArray(config.proxies)) {
      return { success: false, nodes: [], error: '未找到proxies字段' };
    }

    const nodes: ProxyNode[] = config.proxies.map((proxy) => ({
      ...proxy,
      name: String(proxy.name || ''),
      type: String(proxy.type || ''),
      server: String(proxy.server || ''),
      port: Number(proxy.port || 0),
    }));

    return { success: true, nodes };
  } catch (error) {
    const message = error instanceof Error ? error.message : '解析失败';
    return { success: false, nodes: [], error: `YAML解析错误: ${message}` };
  }
}
