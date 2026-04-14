/**
 * JWT Token 生成脚本 (Workers 版本)
 * 从 wrangler secret 读取 JWT_SECRET 并生成 token
 * 用法: npm run gen:token [有效期月数]
 */

import { generateToken } from '../src/utils/jwt-worker.ts';

// 获取有效期参数（默认为3个月）
const months = parseInt(process.argv[2] || '3', 10);

// 验证参数
if (isNaN(months) || months < 1) {
  console.error('错误: 有效期必须是正整数（月数）');
  console.error('用法: npm run gen:token [月数]');
  console.error('示例: npm run gen:token 3');
  process.exit(1);
}

// 从环境变量读取 JWT_SECRET
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('错误: 未设置 JWT_SECRET 环境变量');
  console.error('请先从 wrangler secret 导出: npx wrangler secret get JWT_SECRET');
  console.error('或者手动设置: export JWT_SECRET="你的密钥"');
  process.exit(1);
}

// 生成 token
generateToken(jwtSecret, months)
  .then((token) => {
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
  })
  .catch((err) => {
    console.error('生成 Token 失败:', err.message);
    process.exit(1);
  });
