/**
 * JWT Token 生成脚本
 * 用法: pnpm exec vite-node scripts/generate-token.ts [有效期月数]
 * 默认有效期: 3个月
 */

import { generateToken } from '../src/utils/jwt.ts';

// 获取有效期参数（默认为3个月）
const months = parseInt(process.argv[2] || '3', 10);

// 验证参数
if (isNaN(months) || months < 1) {
  console.error('错误: 有效期必须是正整数（月数）');
  console.error('用法: pnpm exec vite-node scripts/generate-token.ts [月数]');
  console.error('示例: pnpm exec vite-node scripts/generate-token.ts 3');
  process.exit(1);
}

// 生成 token
const token = generateToken(months);
const exp = Math.floor(Date.now() / 1000) + months * 30 * 24 * 60 * 60;

// 输出结果
console.log('========================================');
console.log('✅ JWT Token 生成成功');
console.log('========================================');
console.log('');
console.log('Token:');
console.log(token);
console.log('');
console.log(`有效期: ${months} 个月`);
console.log(`过期时间: ${new Date(exp * 1000).toLocaleString('zh-CN')}`);
console.log('');
console.log('使用方式:');
console.log(`  Header: Authorization: Bearer ${token}`);
console.log(`  Query:  ?token=${token}`);
console.log('');
