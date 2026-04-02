import type { ProxyNode, ParseResult } from '../types.ts';

/**
 * 解析Trojan Base64订阅格式
 * 格式: trojan://password@server:port?params#name
 * @param content Base64编码的订阅内容
 * @returns 解析结果
 */
export function parseTrojan(content: string): ParseResult {
  try {
    // 解码Base64
    const decoded = Buffer.from(content, 'base64').toString('utf-8').trim();
    const lines = decoded.split(/\s+/).filter(Boolean);

    const nodes: ProxyNode[] = [];
    const pattern = /^trojan:\/\/(.+)@(.+):(\d+)\?(.*)#(.+)$/;

    for (const line of lines) {
      const match = line.match(pattern);
      if (!match) continue;

      const [, password, server, portStr, paramsStr, name] = match;
      const params = new URLSearchParams(paramsStr);

      nodes.push({
        name: decodeURIComponent(name),
        type: 'trojan',
        server,
        port: parseInt(portStr, 10),
        password: decodeURIComponent(password),
        sni: params.get('sni') || '',
        'skip-cert-verify': params.get('allowInsecure') === '1',
        network: params.get('type') || 'tcp',
        udp: true,
      });
    }

    if (nodes.length === 0) {
      return { success: false, nodes: [], error: '未找到有效的Trojan节点' };
    }

    return { success: true, nodes };
  } catch (error) {
    const message = error instanceof Error ? error.message : '解析失败';
    return { success: false, nodes: [], error: `Trojan解析错误: ${message}` };
  }
}
