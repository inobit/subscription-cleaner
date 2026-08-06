/**
 * 解码Base64内容（兼容 Workers 无 Buffer 环境）
 * 非法输入返回空字符串
 * @param content Base64编码内容
 * @returns 解码后的UTF-8字符串
 */
export function decodeBase64(content: string): string {
  try {
    const binary = atob(content.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}