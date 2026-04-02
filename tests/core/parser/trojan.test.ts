import { describe, it, expect } from 'vitest';
import { parseTrojan } from '../../../src/core/parser/trojan.ts';

describe('Trojan Parser', () => {
  it('应解析有效的Trojan订阅', () => {
    const urls = [
      'trojan://pass123@1.2.3.4:443?sni=example.com&allowInsecure=1&type=ws#节点1',
      'trojan://pass456@5.6.7.8:8388?sni=test.com&type=tcp#节点2',
    ];
    const base64 = Buffer.from(urls.join('\n')).toString('base64');

    const result = parseTrojan(base64);
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].name).toBe('节点1');
    expect(result.nodes[0].type).toBe('trojan');
    expect(result.nodes[0].server).toBe('1.2.3.4');
  });

  it('应处理无效的订阅内容', () => {
    const result = parseTrojan('invalid base64');
    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到有效的Trojan节点');
  });
});
