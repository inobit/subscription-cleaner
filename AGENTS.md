# AGENTS.md

Hono + TypeScript 订阅节点清洗服务，部署于 **Cloudflare Workers**（非 Node.js）。聚合订阅源 → 解析为统一 `ProxyNode` → 去重过滤 → 输出 Clash YAML，全程 JWT 认证、KV 存配置。

## 常用命令

```bash
pnpm dev          # 本地开发（wrangler 模拟）
pnpm run deploy   # 部署（pnpm v10 下直接 `pnpm deploy` 是内置命令，会报错）
npx wrangler tail subscription-cleaner   # 实时日志
pnpm test / pnpm type-check / pnpm lint / pnpm gen:token
```

## 架构要点

- **入口**: `src/worker.ts`（Hono 路由 `GET /health`、`/subscription(*)`）
- **核心**: `services/shared.ts` 聚合流程；`core/parser/{clash,trojan,shadowsocks,vless}.ts` 解析；`core/base64.ts` 解码；`core/cleaner.ts` 清洗
- **配置**: 全部存 KV，**不读文件系统**（`resources/` 与 `dist/` 是遗留物，勿用）
  - 订阅源 `config:sources`、手动代理 `config:proxies`、节点缓存 `cache:<url>`
  - `protocol` 支持：`clash` / `trojan` / `ss` / `vless`（v2rayN Base64 格式，支持 Reality）
- **测试**: `tests/` 与源码同构，Vitest；测试数据一律 mock，勿用真实 token

## Workers 环境坑（务必遵守）

1. **没有全局 `Buffer`**：base64 解码一律用 `core/parser/base64.ts` 的 `decodeBase64()`，禁 `Buffer.from`
2. **`URL.username` 是 URL 编码值**（如 `%3D`）：解码前先 `decodeURIComponent`
3. **JWT_SECRET** 走 Dashboard 设置，`config-worker.ts` 强制要求；日志在 Dashboard → Worker → Observability 或 `wrangler tail`