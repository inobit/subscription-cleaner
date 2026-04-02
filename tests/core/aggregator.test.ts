import { describe, it, expect } from 'vitest';
import { aggregateNodes, tagNodes } from '../../src/core/aggregator.ts';
import type { ProxyNode } from '../../src/core/types.ts';

describe('Node Aggregator', () => {
  describe('aggregateNodes', () => {
    it('应聚合多个节点列表', () => {
      const list1: ProxyNode[] = [{ name: '节点1', type: 'ss', server: '1.1.1.1', port: 8388 }];
      const list2: ProxyNode[] = [{ name: '节点2', type: 'trojan', server: '2.2.2.2', port: 443 }];

      const result = aggregateNodes([list1, list2]);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('节点1');
      expect(result[1].name).toBe('节点2');
    });

    it('应过滤非数组输入', () => {
      const list1: ProxyNode[] = [{ name: '节点1', type: 'ss', server: '1.1.1.1', port: 8388 }];
      // @ts-expect-error 测试非数组输入
      const result = aggregateNodes([list1, null, undefined]);
      expect(result).toHaveLength(1);
    });
  });

  describe('tagNodes', () => {
    it('应为节点添加标签前缀', () => {
      const nodes: ProxyNode[] = [
        { name: '节点1', type: 'ss', server: '1.1.1.1', port: 8388 },
        { name: '节点2', type: 'ss', server: '2.2.2.2', port: 8388 },
      ];

      const result = tagNodes(nodes, '来源A');
      expect(result[0].name).toBe('来源A-节点1');
      expect(result[1].name).toBe('来源A-节点2');
    });
  });
});
