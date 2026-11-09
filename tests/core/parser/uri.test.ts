import { describe, it, expect, vi } from 'vitest';
import { normalizeManualProxies, parseProxyUri } from '../../../src/core/parser/uri.ts';

describe('parseProxyUri', () => {
  it('应分发到 vless 解析器', () => {
    const node = parseProxyUri(
      'vless://uuid@1.2.3.4:443?security=tls&type=ws&path=%2Fray#uri-node'
    );
    expect(node?.type).toBe('vless');
    expect(node?.name).toBe('uri-node');
  });

  it('未支持的 scheme 应返回 null', () => {
    expect(parseProxyUri('trojan://pass@1.2.3.4:443#t')).toBeNull();
    expect(parseProxyUri('ss://YWVzLTI1Ni1nY206cGFzcw@1.2.3.4:8388#s')).toBeNull();
    expect(parseProxyUri('随便一段文本')).toBeNull();
  });
});

describe('normalizeManualProxies', () => {
  it('应保留对象条目并解析分享链接条目', () => {
    const entries = [
      { name: 'mine-澳大利亚', type: 'vless', server: 'r.au.example.com', port: 443 },
      'vless://uuid@1.2.3.4:443?security=tls&type=ws&path=%2Fray#My-WS-Node',
    ];

    const nodes = normalizeManualProxies(entries);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toEqual(entries[0]);
    expect(nodes[1].name).toBe('My-WS-Node');
    expect(nodes[1]['ws-opts']).toEqual({ path: '/ray' });
  });

  it('应跳过无法解析的条目并记录 warn', () => {
    const warn = vi.fn();
    const nodes = normalizeManualProxies(
      [
        'vless://uuid@1.2.3.4:443?security=tls#ok',
        'trojan://pass@1.2.3.4:443#unsupported',
        'vless://broken',
        '',
      ],
      { warn }
    );

    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe('ok');
    expect(warn).toHaveBeenCalledTimes(2);
    // 日志不应暴露完整链接
    expect(warn.mock.calls[0][0]).toContain('trojan');
  });

  it('空数组应返回空结果', () => {
    expect(normalizeManualProxies([])).toEqual([]);
  });
});
