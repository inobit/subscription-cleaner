import type { ProxyNode, ParseResult } from '../types.ts';

/**
 * 解析Shadowsocks Base64订阅格式
 * 格式: ss://Base64(method:password)@server:port#name
 * 或 ss://method:password@server:port#name
 * @param content Base64编码的订阅内容
 * @returns 解析结果
 */
export function parseShadowsocks(content: string): ParseResult {
  try {
    // 解码Base64
    const decoded = Buffer.from(content, 'base64').toString('utf-8').trim();
    const lines = decoded.split(/\s+/).filter(Boolean);

    const nodes: ProxyNode[] = [];

    for (const line of lines) {
      if (!line.startsWith('ss://')) continue;

      try {
        const url = new URL(line);
        const name = decodeURIComponent(url.hash.slice(1) || '');
        const server = url.hostname;
        const port = url.port ? parseInt(url.port, 10) : 0;

        // 解析用户信息
        let method = '';
        let password = '';

        if (url.username) {
          // ss://Base64(method:password)@server:port#name
          const userInfo = Buffer.from(url.username, 'base64').toString('utf-8');
          const [m, p] = userInfo.split(':');
          method = m || '';
          password = p || '';
        } else {
          // ss://method:password@server:port#name (非标准，但存在)
          const beforeAt = line.slice(5).split('@')[0];
          const decodedInfo = Buffer.from(beforeAt, 'base64').toString('utf-8');
          const [m, p] = decodedInfo.split(':');
          method = m || '';
          password = p || '';
        }

        // 解析插件参数
        const plugin = url.searchParams.get('plugin') || '';
        const pluginOpts: Record<string, string> = {};
        if (plugin) {
          const parts = plugin.split(';');
          for (const part of parts.slice(1)) {
            const [key, value] = part.split('=');
            if (key && value) pluginOpts[key] = value;
          }
        }

        nodes.push({
          name,
          type: 'ss',
          server,
          port,
          cipher: method,
          password,
          plugin: plugin.split(';')[0] || '',
          'plugin-opts': pluginOpts,
          udp: true,
        });
      } catch {
        // 跳过无效的URL
        continue;
      }
    }

    if (nodes.length === 0) {
      return { success: false, nodes: [], error: '未找到有效的Shadowsocks节点' };
    }

    return { success: true, nodes };
  } catch (error) {
    const message = error instanceof Error ? error.message : '解析失败';
    return { success: false, nodes: [], error: `Shadowsocks解析错误: ${message}` };
  }
}
