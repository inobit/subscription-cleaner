import type { ProxyNode, CleanConfig } from './types.ts';

/**
 * 根据服务器和端口去重
 * @param nodes 节点列表
 * @returns 去重后的节点列表
 */
function deduplicateByServer(nodes: ProxyNode[]): ProxyNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    const key = `${node.server}:${node.port}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 清理节点列表
 * 包括：去重、过滤无效节点
 * @param nodes 原始节点列表
 * @param config 清洗配置
 * @returns 清洗后的节点列表
 */
export function cleanNodes(nodes: ProxyNode[], config?: CleanConfig): ProxyNode[] {
  // 过滤无效节点
  let cleaned = nodes.filter((node) => {
    return node.name && node.server && node.port > 0 && node.port <= 65535;
  });

  // 去重
  if (config?.removeDuplicate ?? true) {
    cleaned = deduplicateByServer(cleaned);
  }

  // 应用命名模板
  if (config?.nameTemplate) {
    const template = config.nameTemplate;
    cleaned = cleaned.map((node, index) => ({
      ...node,
      name: template.replace('{{index}}', String(index + 1)),
    }));
  }

  return cleaned;
}
