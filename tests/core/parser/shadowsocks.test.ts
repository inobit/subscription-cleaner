import { describe, it, expect } from 'vitest';
import { parseShadowsocks } from '../../../src/core/parser/shadowsocks.ts';

describe('Shadowsocks Parser', () => {
  it('应解析有效的SS订阅', () => {
    const methodPass = Buffer.from('aes-256-gcm:password123').toString('base64');
    const urls = [
      `ss://${methodPass}@1.2.3.4:8388#节点1`,
      `ss://${methodPass}@5.6.7.8:443#节点2`,
    ];
    const base64 = Buffer.from(urls.join('\n')).toString('base64');

    const result = parseShadowsocks(base64);
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].name).toBe('节点1');
    expect(result.nodes[0].type).toBe('ss');
    expect(result.nodes[0].cipher).toBe('aes-256-gcm');
  });

  it('应处理带插件的SS配置', () => {
    const methodPass = Buffer.from('chacha20:pass456').toString('base64');
    const url = `ss://${methodPass}@1.2.3.4:443?plugin=obfs-local;obfs=http;obfs-host=example.com#节点3`;
    const base64 = Buffer.from(url).toString('base64');

    const result = parseShadowsocks(base64);
    expect(result.success).toBe(true);
    expect(result.nodes[0].plugin).toBe('obfs-local');
  });
});
