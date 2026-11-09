import type { ProxyNode, ParseResult } from '../types.ts';
import { splitUriLines } from './uri-utils.ts';

/**
 * 解析单条 VLESS 分享链接
 * 格式: vless://<uuid>@<host>:<port>?<query>#<name>
 * 参数映射遵循 mihomo 的 vless outbound 字段（reality-opts / ws-opts / grpc-opts / h2-opts / http-opts）
 * @param uri 分享链接原文
 * @returns 节点对象；链接非法、缺少关键参数或传输方式不受支持时返回 null
 */
export function parseVlessUri(uri: string): ProxyNode | null {
  const trimmed = uri.trim();
  if (!trimmed.toLowerCase().startsWith('vless://')) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // URL.username 是 URL 编码值，需先解码
  const uuid = safeDecode(url.username);
  // IPv6 字面量会被 URL 保留方括号，mihomo 侧要求裸地址
  const server = url.hostname.replace(/^\[|\]$/g, '');
  const port = Number.parseInt(url.port, 10);

  if (!uuid || !server || !Number.isInteger(port) || port <= 0 || port > 65535) {
    return null;
  }

  const params = url.searchParams;
  const network = resolveNetwork(
    (params.get('type') || 'tcp').toLowerCase(),
    (params.get('headerType') || '').toLowerCase()
  );
  if (!network) return null;

  const security = (params.get('security') || 'none').toLowerCase();
  const isReality = security === 'reality';
  const tls = isReality || security === 'tls' || security === 'xtls';
  const publicKey = params.get('pbk') || '';

  // REALITY 缺公钥无法完成握手，mihomo 也要求 public-key 必填
  if (isReality && !publicKey) return null;

  const sni = params.get('sni') || params.get('peer') || '';
  const host = params.get('host') || '';
  const path = params.get('path') || '';
  const flow = params.get('flow') || '';
  const fingerprint = params.get('fp') || '';

  const node: ProxyNode = {
    name: safeDecode(url.hash.slice(1)) || `vless-${server}-${port}`,
    type: 'vless',
    server,
    port,
    uuid,
    network,
    tls,
    udp: true,
  };

  // flow 只在 TLS/REALITY 下有意义，纯 VLESS 带 flow 会让 mihomo 启动失败
  if (flow && tls) node.flow = flow;
  if (tls && sni) node.servername = sni;
  if (tls && fingerprint) node['client-fingerprint'] = fingerprint;

  const alpn = params.get('alpn');
  if (tls && alpn) {
    node.alpn = alpn
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // encryption=none 是 VLESS 经典模式，省略即可；其它值（mlkem 套件）原样透传
  const encryption = params.get('encryption');
  if (encryption && encryption !== 'none') node.encryption = encryption;

  const insecure = params.get('insecure') ?? params.get('allowInsecure');
  if (insecure === '1' || insecure === 'true') node['skip-cert-verify'] = true;

  if (isReality) {
    node['reality-opts'] = {
      'public-key': publicKey,
      'short-id': params.get('sid') || '',
    };
  }

  switch (network) {
    case 'ws':
      node['ws-opts'] = {
        path: path || '/',
        ...(host ? { headers: { Host: host } } : {}),
      };
      break;
    case 'grpc':
      node['grpc-opts'] = {
        'grpc-service-name': params.get('serviceName') || path || '',
      };
      break;
    case 'h2':
      node['h2-opts'] = {
        host: splitList(host),
        path: path || '/',
      };
      break;
    case 'http':
      node['http-opts'] = {
        method: 'GET',
        path: [path || '/'],
        ...(host ? { headers: { Host: [host] } } : {}),
      };
      break;
    default:
      // tcp 无需额外 opts
      break;
  }

  return node;
}

/**
 * 解析VLESS订阅内容
 * 支持裸分享链接（每行一条）与 Base64 编码两种上游格式
 * @param content 订阅内容
 * @returns 解析结果
 */
export function parseVless(content: string): ParseResult {
  try {
    const nodes: ProxyNode[] = [];
    for (const line of splitUriLines(content)) {
      const node = parseVlessUri(line);
      if (node) nodes.push(node);
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

/**
 * 把分享链接的传输方式映射为 mihomo 的 network 字段
 * @param transport 链接中的 type 参数
 * @param headerType 链接中的 headerType 参数（仅 tcp 有效）
 * @returns mihomo network 值；不受支持时返回 null
 */
function resolveNetwork(transport: string, headerType: string): string | null {
  switch (transport) {
    case 'tcp':
      // tcp + HTTP 伪装对应 mihomo 的 network: http
      return headerType === 'http' ? 'http' : 'tcp';
    case 'ws':
      return 'ws';
    case 'grpc':
      return 'grpc';
    // v2ray 的 http 传输层就是 HTTP/2
    case 'http':
    case 'h2':
      return 'h2';
    default:
      // kcp / quic / xhttp 等 mihomo 的 vless outbound 不支持
      return null;
  }
}

/**
 * URL 解码，非法编码时退回原值
 * @param value 待解码字符串
 * @returns 解码后的字符串
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * 逗号分隔的列表参数拆成数组
 * @param value 原始参数值
 * @returns 去空白后的字符串数组
 */
function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
