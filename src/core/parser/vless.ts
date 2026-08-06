import type { ProxyNode, ParseResult } from '../types.ts';

/**
 * 解析Vless Base64订阅格式
 * 格式: vless://uuid@server:port?params#name
 * 常见参数: type(传输协议), security(tls/reality), flow, sni, fp, pbk(reality公钥), sid(reality短ID)
 * @param content Base64编码的订阅内容
 * @returns 解析结果
 */
export function parseVless(content: string): ParseResult {
  try {
    // 解码Base64
    const decoded = Buffer.from(content, 'base64').toString('utf-8').trim();
    const lines = decoded.split(/\s+/).filter(Boolean);

    const nodes: ProxyNode[] = [];
    const pattern = /^vless:\/\/(.+)@(.+):(\d+)\?(.*)#(.+)$/;

    for (const line of lines) {
      const match = line.match(pattern);
      if (!match) continue;

      const [, uuid, server, portStr, paramsStr, name] = match;
      const params = new URLSearchParams(paramsStr);

      nodes.push({
        name: decodeURIComponent(name),
        type: 'vless',
        server,
        port: parseInt(portStr, 10),
        uuid,
        network: params.get('type') || 'tcp',
        flow: params.get('flow') || '',
        'client-fingerprint': params.get('fp') || '',
        servername: params.get('sni') || '',
        tls: params.get('security') !== 'none' && params.get('security') !== null,
        'reality-opts': {
          'public-key': params.get('pbk') || '',
          'short-id': params.get('sid') || '',
        },
        'skip-cert-verify': params.get('insecure') === '1',
        udp: true,
      });
    }

    if (nodes.length === 0) {
      return { success: false, nodes: [], error: '未找到有效的Vless节点' };
    }

    return { success: true, nodes };
  } catch (error) {
    const message = error instanceof Error ? error.message : '解析失败';
    return { success: false, nodes: [], error: `Vless解析错误: ${message}` };
  }
}