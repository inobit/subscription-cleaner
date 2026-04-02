import { readFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { createChildLogger } from '../utils/logger.ts';
import { parseClash } from '../core/parser/clash.ts';
import { parseTrojan } from '../core/parser/trojan.ts';
import { parseShadowsocks } from '../core/parser/shadowsocks.ts';
import { aggregateNodes, tagNodes } from '../core/aggregator.ts';
import { cleanNodes } from '../core/cleaner.ts';
import { getCachedNodes, setCachedNodes } from '../utils/cache.ts';
import type { ProxyNode, ParseResult, SubscriptionSource } from '../core/types.ts';

const logger = createChildLogger('subscription');

/**
 * 获取远程订阅内容
 * @param url 订阅URL
 * @returns 原始内容
 */
async function fetchSubscription(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

/**
 * 根据协议类型选择解析器
 * @param protocol 协议类型
 * @returns 解析函数
 */
function getParser(protocol: string) {
  const parsers: Record<string, (content: string) => ParseResult> = {
    clash: parseClash,
    trojan: parseTrojan,
    ss: parseShadowsocks,
  };
  return parsers[protocol];
}

/**
 * 处理单个订阅源
 * @param source 订阅源配置
 * @returns 节点列表
 */
async function processSource(source: SubscriptionSource): Promise<ProxyNode[]> {
  logger.info(`处理订阅源: ${source.tag} (${source.protocol})`);

  // 检查缓存
  if (source.cacheEnabled) {
    const cached = getCachedNodes(source.url, source.cacheTtlDays);
    if (cached) {
      logger.info(`缓存命中: ${source.tag}，使用 ${cached.length} 个缓存节点`);
      // 应用前缀（如果配置了prefix，优先使用prefix；否则使用tag）
      const prefix = source.prefix ?? source.tag;
      if (prefix) {
        return tagNodes(cached, prefix);
      }
      return cached;
    }
  }

  try {
    const content = await fetchSubscription(source.url);
    const parser = getParser(source.protocol);

    if (!parser) {
      logger.error(`不支持的协议类型: ${source.protocol}`);
      return [];
    }

    const result = parser(content);

    if (!result.success) {
      logger.error(`解析失败: ${result.error}`);
      return [];
    }

    logger.info(`成功解析 ${result.nodes.length} 个节点`);

    // 存入缓存（原始节点，不带前缀）
    if (source.cacheEnabled) {
      setCachedNodes(source.url, result.nodes);
      logger.info(`已缓存: ${source.tag}`);
    }

    // 应用前缀（如果配置了prefix，优先使用prefix；否则使用tag）
    const prefix = source.prefix ?? source.tag;
    if (prefix) {
      return tagNodes(result.nodes, prefix);
    }
    return result.nodes;
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    logger.error(`获取订阅失败: ${message}`);
    return [];
  }
}

/**
 * 聚合所有订阅源的节点
 * @param sources 订阅源列表
 * @returns 聚合并清洗后的节点列表
 */
export async function aggregateSubscriptions(sources: SubscriptionSource[]): Promise<ProxyNode[]> {
  logger.info(`开始处理 ${sources.length} 个订阅源`);

  const enabledSources = sources.filter((s) => s.enabled);
  const nodeLists = await Promise.all(enabledSources.map((source) => processSource(source)));

  const aggregated = aggregateNodes(nodeLists);
  const cleaned = cleanNodes(aggregated);

  logger.info(`处理完成，共 ${cleaned.length} 个有效节点`);
  return cleaned;
}

/**
 * 加载手动配置的代理节点
 * @param resourcesDir 资源目录路径
 * @returns 手动代理节点列表，文件不存在返回空数组
 */
export async function loadManualProxies(resourcesDir: string): Promise<ProxyNode[]> {
  try {
    const filePath = join(resourcesDir, 'proxies.yaml');
    const content = await readFile(filePath, 'utf-8');
    const parsed = yaml.load(content) as { proxies?: ProxyNode[] };

    if (!parsed.proxies || !Array.isArray(parsed.proxies)) {
      logger.warn('proxies.yaml 中没有找到 proxies 列表');
      return [];
    }

    logger.info(`成功加载 ${parsed.proxies.length} 个手动代理节点`);
    return parsed.proxies;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      logger.debug('proxies.yaml 文件不存在，跳过手动代理加载');
      return [];
    }
    logger.error(`加载手动代理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return [];
  }
}
