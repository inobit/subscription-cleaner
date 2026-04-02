import { describe, it, expect } from 'vitest';
import { parseClash } from '../../../src/core/parser/clash.ts';

describe('Clash Parser', () => {
  it('应解析有效的Clash配置', () => {
    const yaml = `
proxies:
  - name: "节点1"
    type: ss
    server: 1.2.3.4
    port: 8388
  - name: "节点2"
    type: vmess
    server: 5.6.7.8
    port: 443
`;
    const result = parseClash(yaml);
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].name).toBe('节点1');
    expect(result.nodes[0].type).toBe('ss');
  });

  it('应处理无效的YAML', () => {
    const result = parseClash('not valid yaml: [}');
    expect(result.success).toBe(false);
    expect(result.error).toContain('YAML解析错误');
  });

  it('应处理缺少proxies字段的配置', () => {
    const result = parseClash('other: value');
    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到proxies字段');
  });
});
