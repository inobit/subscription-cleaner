import type { ProxyNode, ParseResult, SubscriptionSource } from '../../core/types.ts';
import { parseClash } from '../../core/parser/clash.ts';
import { parseTrojan } from '../../core/parser/trojan.ts';
import { parseShadowsocks } from '../../core/parser/shadowsocks.ts';
import { aggregateNodes, tagNodes } from '../../core/aggregator.ts';
import { cleanNodes } from '../../core/cleaner.ts';
import type { StorageAdapter, Logger } from '../../config/types.ts';

/**
 * 获取远程订阅内容
 * @param url 订阅URL
 * @returns 原始内容
 */
export async function fetchSubscription(url: string): Promise<string> {
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
export function getParser(protocol: string): ((content: string) => ParseResult) | undefined {
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
 * @param storage 存储适配器
 * @param logger 日志器
 * @returns 节点列表
 */
export async function processSource(
  source: SubscriptionSource,
  storage: StorageAdapter,
  logger: Logger
): Promise<ProxyNode[]> {
  logger.info(`处理订阅源: ${source.tag} (${source.protocol})`);

  // 检查缓存
  if (source.cacheEnabled) {
    const cached = await storage.getCache(source.url);
    if (cached) {
      logger.info(`缓存命中: ${source.tag}，使用 ${cached.length} 个缓存节点`);
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

    // 存入缓存
    if (source.cacheEnabled) {
      await storage.setCache(source.url, result.nodes, source.cacheTtlDays || 30);
      logger.info(`已缓存: ${source.tag}`);
    }

    // 应用前缀
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
 * @param manualNodes 手动配置的代理节点
 * @param storage 存储适配器
 * @param logger 日志器
 * @returns 聚合并清洗后的节点列表
 */
export async function aggregateSubscriptions(
  sources: SubscriptionSource[],
  manualNodes: ProxyNode[] = [],
  storage: StorageAdapter,
  logger: Logger
): Promise<ProxyNode[]> {
  logger.info(`开始处理 ${sources.length} 个订阅源`);

  const enabledSources = sources.filter((s) => s.enabled);
  const nodeLists = await Promise.all(
    enabledSources.map((source) => processSource(source, storage, logger))
  );

  const aggregated = aggregateNodes(nodeLists);
  const cleaned = cleanNodes(aggregated);

  // 手动代理放在前面
  const result = [...manualNodes, ...cleaned];

  logger.info(
    `处理完成，共 ${result.length} 个节点（手动: ${manualNodes.length}, 清洗后: ${cleaned.length}）`
  );
  return result;
}
