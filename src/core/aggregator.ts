import type { ProxyNode } from './types.ts';

/**
 * 聚合多个节点列表
 * @param nodeLists 节点列表数组
 * @returns 聚合后的节点列表
 */
export function aggregateNodes(nodeLists: ProxyNode[][]): ProxyNode[] {
  const aggregated: ProxyNode[] = [];

  for (const nodes of nodeLists) {
    if (Array.isArray(nodes)) {
      aggregated.push(...nodes);
    }
  }

  return aggregated;
}

/**
 * 为节点添加标签前缀
 * @param nodes 节点列表
 * @param tag 标签前缀
 * @returns 重命名后的节点列表
 */
export function tagNodes(nodes: ProxyNode[], tag: string): ProxyNode[] {
  return nodes.map((node) => ({
    ...node,
    name: `${tag}-${node.name}`,
  }));
}
