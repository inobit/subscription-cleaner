import { describe, it, expect } from 'vitest';
import { parseVless } from '../../../src/core/parser/vless.ts';

describe('Vless Parser', () => {
  it('应解析有效的Vless Reality订阅', () => {
    const urls = [
      'vless://11111111-2222-3333-4444-555555555555@hk.example.com:29901?type=tcp&encryption=none&security=reality&flow=xtls-rprx-vision&fp=chrome&insecure=0&sni=speed.cloudflare.com&pbk=Wsq5j_8k0TUFF_WrA7unv2lwGk2b7HMRSD_Rc75a-Fg&sid=4be19182#%5B%E5%AE%9E%E9%AA%8C%5D%20%E9%A6%99%E6%B8%AF%2001',
      'vless://11111111-2222-3333-4444-555555555555@sg.example.com:443?type=tcp&security=reality&flow=xtls-rprx-vision&fp=chrome&sni=www.bing.com&pbk=GjFv0ZbSjckCtpTCo_Fx3l7mJpqamqI2UOJGCtlddDU&sid=672ac7ff#%5B%E5%AE%9E%E9%AA%8C%5D%20%E6%96%B0%E5%8A%A0%E5%9D%A1',
    ];
    const base64 = Buffer.from(urls.join('\n')).toString('base64');

    const result = parseVless(base64);
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].name).toBe('[实验] 香港 01');
    expect(result.nodes[0].type).toBe('vless');
    expect(result.nodes[0].server).toBe('hk.example.com');
    expect(result.nodes[0].port).toBe(29901);
    expect(result.nodes[0].uuid).toBe('11111111-2222-3333-4444-555555555555');
    expect(result.nodes[0].network).toBe('tcp');
    expect(result.nodes[0].flow).toBe('xtls-rprx-vision');
    expect(result.nodes[0]['client-fingerprint']).toBe('chrome');
    expect(result.nodes[0].servername).toBe('speed.cloudflare.com');
    expect(result.nodes[0]['reality-opts']).toEqual({
      'public-key': 'Wsq5j_8k0TUFF_WrA7unv2lwGk2b7HMRSD_Rc75a-Fg',
      'short-id': '4be19182',
    });
    expect(result.nodes[0]['skip-cert-verify']).toBe(false);
  });

  it('应解析普通Vless Tls订阅', () => {
    const url = 'vless://11111111-2222-3333-4444-555555555555@1.2.3.4:443?type=ws&security=tls&sni=example.com#节点WS';
    const base64 = Buffer.from(url).toString('base64');

    const result = parseVless(base64);
    expect(result.success).toBe(true);
    expect(result.nodes[0].network).toBe('ws');
    expect(result.nodes[0].servername).toBe('example.com');
    expect(result.nodes[0].tls).toBe(true);
    expect(result.nodes[0]['reality-opts']).toEqual({ 'public-key': '', 'short-id': '' });
  });

  it('应处理无效的订阅内容', () => {
    const result = parseVless('invalid base64');
    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到有效的Vless节点');
  });

  it('应跳过非Vless的链接行', () => {
    const urls = ['ss://aes-256-gcm:pass@1.2.3.4:8388#ss节点', 'invalid line'];
    const base64 = Buffer.from(urls.join('\n')).toString('base64');

    const result = parseVless(base64);
    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到有效的Vless节点');
  });
});