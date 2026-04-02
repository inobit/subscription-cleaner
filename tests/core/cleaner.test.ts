import { describe, it, expect } from 'vitest';
import { cleanNodes } from '../../src/core/cleaner.ts';
import type { ProxyNode } from '../../src/core/types.ts';

describe('Node Cleaner', () => {
  it('应过滤无效节点', () => {
    const nodes: ProxyNode[] = [
      { name: '有效节点', type: 'ss', server: '1.1.1.1', port: 8388 },
      { name: '', type: 'ss', server: '2.2.2.2', port: 8388 },
      { name: '无效端口', type: 'ss', server: '3.3.3.3', port: 0 },
    ];

    const result = cleanNodes(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('有效节点');
  });

  it('应去除重复节点', () => {
    const nodes: ProxyNode[] = [
      { name: '节点A', type: 'ss', server: '1.1.1.1', port: 8388 },
      { name: '节点B', type: 'trojan', server: '1.1.1.1', port: 8388 },
      { name: '节点C', type: 'ss', server: '2.2.2.2', port: 443 },
    ];

    const result = cleanNodes(nodes);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('节点A');
  });

  it('应支持禁用去重', () => {
    const nodes: ProxyNode[] = [
      { name: '节点A', type: 'ss', server: '1.1.1.1', port: 8388 },
      { name: '节点B', type: 'trojan', server: '1.1.1.1', port: 8388 },
    ];

    const result = cleanNodes(nodes, { removeDuplicate: false });
    expect(result).toHaveLength(2);
  });
});
