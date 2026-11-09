import { describe, it, expect } from 'vitest';
import { parseVless, parseVlessUri } from '../../../src/core/parser/vless.ts';

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
    // insecure=0 表示不跳过证书校验，字段应缺省
    expect(result.nodes[0]['skip-cert-verify']).toBeUndefined();
  });

  it('应解析普通Vless Tls订阅', () => {
    const url = 'vless://11111111-2222-3333-4444-555555555555@1.2.3.4:443?type=ws&security=tls&sni=example.com#节点WS';
    const base64 = Buffer.from(url).toString('base64');

    const result = parseVless(base64);
    expect(result.success).toBe(true);
    expect(result.nodes[0].network).toBe('ws');
    expect(result.nodes[0].servername).toBe('example.com');
    expect(result.nodes[0].tls).toBe(true);
    // reality-opts 只在 security=reality 时输出
    expect(result.nodes[0]['reality-opts']).toBeUndefined();
  });

  it('应支持裸分享链接内容（未 Base64 编码）', () => {
    const content = [
      'vless://11111111-2222-3333-4444-555555555555@1.2.3.4:443?type=ws&security=tls&sni=example.com#A',
      'vless://11111111-2222-3333-4444-555555555555@5.6.7.8:8443?security=reality&pbk=PubKey&sid=abcd#B',
    ].join('\n');

    const result = parseVless(content);
    expect(result.success).toBe(true);
    expect(result.nodes.map((node) => node.name)).toEqual(['A', 'B']);
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

describe('parseVlessUri', () => {
  it('应解析 TLS + WebSocket，并保留 path 与 Host', () => {
    const node = parseVlessUri(
      'vless://12345678-1234-1234-1234-123456789abc@192.0.2.1:443?encryption=none&security=tls&sni=example.com&type=ws&path=%2Fray#My-WS-Node'
    );

    expect(node).toEqual({
      name: 'My-WS-Node',
      type: 'vless',
      server: '192.0.2.1',
      port: 443,
      uuid: '12345678-1234-1234-1234-123456789abc',
      network: 'ws',
      tls: true,
      udp: true,
      servername: 'example.com',
      'ws-opts': { path: '/ray' },
    });
  });

  it('应把 host 参数写入 ws-opts.headers', () => {
    const node = parseVlessUri(
      'vless://uuid@1.2.3.4:443?type=ws&security=tls&sni=sni.example.com&host=cdn.example.com&path=%2Fws#WS-HOST'
    );

    expect(node?.['ws-opts']).toEqual({
      path: '/ws',
      headers: { Host: 'cdn.example.com' },
    });
  });

  it('应解析 REALITY + xtls-rprx-vision', () => {
    const node = parseVlessUri(
      'vless://12345678-1234-1234-1234-123456789abc@192.0.2.1:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=example.com&fp=chrome&pbk=PublicKeyStr&sid=ShortIdStr&type=tcp#My-VLESS-Node'
    );

    expect(node).toEqual({
      name: 'My-VLESS-Node',
      type: 'vless',
      server: '192.0.2.1',
      port: 443,
      uuid: '12345678-1234-1234-1234-123456789abc',
      network: 'tcp',
      tls: true,
      udp: true,
      flow: 'xtls-rprx-vision',
      servername: 'example.com',
      'client-fingerprint': 'chrome',
      'reality-opts': { 'public-key': 'PublicKeyStr', 'short-id': 'ShortIdStr' },
    });
  });

  it('REALITY 缺少 pbk 时应丢弃节点', () => {
    const node = parseVlessUri(
      'vless://uuid@1.2.3.4:443?security=reality&sni=example.com#no-pbk'
    );
    expect(node).toBeNull();
  });

  it('无 TLS 时不应透传 flow（否则 mihomo 拒绝启动）', () => {
    const node = parseVlessUri('vless://uuid@1.2.3.4:80?security=none&flow=xtls-rprx-vision#plain');
    expect(node).not.toBeNull();
    expect(node?.tls).toBe(false);
    expect(node?.flow).toBeUndefined();
  });

  it('缺少 #name 时应回退为 server-port 命名', () => {
    const node = parseVlessUri('vless://uuid@1.2.3.4:443?security=tls');
    expect(node?.name).toBe('vless-1.2.3.4-443');
  });

  it('应解析 grpc / h2 / tcp-http 三种传输的 opts', () => {
    const grpc = parseVlessUri(
      'vless://uuid@1.2.3.4:443?security=tls&type=grpc&serviceName=mygrpc#grpc'
    );
    expect(grpc?.network).toBe('grpc');
    expect(grpc?.['grpc-opts']).toEqual({ 'grpc-service-name': 'mygrpc' });

    const h2 = parseVlessUri('vless://uuid@1.2.3.4:443?security=tls&type=http&host=a.com,b.com&path=%2Fh2#h2');
    expect(h2?.network).toBe('h2');
    expect(h2?.['h2-opts']).toEqual({ host: ['a.com', 'b.com'], path: '/h2' });

    const tcpHttp = parseVlessUri(
      'vless://uuid@1.2.3.4:80?type=tcp&headerType=http&host=obfs.example.com&path=%2Fobfs#tcp-http'
    );
    expect(tcpHttp?.network).toBe('http');
    expect(tcpHttp?.['http-opts']).toEqual({
      method: 'GET',
      path: ['/obfs'],
      headers: { Host: ['obfs.example.com'] },
    });
  });

  it('应支持 IPv6 地址、insecure 与 alpn', () => {
    const node = parseVlessUri(
      'vless://uuid@[2001:db8::1]:443?security=tls&sni=a.example.com&alpn=h2,http%2F1.1&insecure=1#v6'
    );

    expect(node?.server).toBe('2001:db8::1');
    expect(node?.alpn).toEqual(['h2', 'http/1.1']);
    expect(node?.['skip-cert-verify']).toBe(true);
  });

  it('不支持的传输方式应返回 null', () => {
    expect(parseVlessUri('vless://uuid@1.2.3.4:443?type=kcp#kcp')).toBeNull();
    expect(parseVlessUri('vless://uuid@1.2.3.4:443?type=quic#quic')).toBeNull();
  });

  it('非法链接应返回 null', () => {
    expect(parseVlessUri('trojan://pass@1.2.3.4:443#t')).toBeNull();
    expect(parseVlessUri('vless://not-a-url')).toBeNull();
    expect(parseVlessUri('vless://uuid@1.2.3.4?security=tls')).toBeNull();
  });
});
