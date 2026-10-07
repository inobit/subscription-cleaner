# 订阅节点清洗服务 (Cloudflare Workers 版本)

基于 Hono + TypeScript 的订阅节点清洗服务，部署在 Cloudflare Workers 上，支持静态 Token 认证和多格式订阅解析。

## 功能特性

- 🔐 静态 Token 认证（支持 Header 和 Query 参数）
- 📡 多格式订阅解析（Clash YAML / Trojan / Shadowsocks / Vless Reality）
- 🧹 节点清洗（去重、过滤无效节点）
- 🏷️ 自动标签前缀
- 📝 手动代理配置（通过 KV 存储配置）
- 🚀 Cloudflare Workers 部署，全球边缘节点加速
- 📊 内置 observability 日志
- 🧪 完整单元测试覆盖

## 快速开始

### 开发环境

```bash
# 安装依赖
pnpm install

# 本地开发（Wrangler 模拟 Workers 环境）
pnpm dev
```

### 配置

Worker 使用 KV 存储配置，需要在 Cloudflare Dashboard 中设置：

1. **创建 KV 命名空间**：在 Cloudflare Dashboard → Workers → KV 中创建
2. **绑定 KV**：在 `wrangler.toml` 中配置 KV 绑定：
   ```toml
   [[kv_namespaces]]
   binding = "SUBSCRIPTION_KV"
   id = "your-kv-namespace-id"
   ```
3. **设置 AUTH_TOKEN**：`pnpm gen` 生成后，执行 `npx wrangler secret put AUTH_TOKEN`（或在 Dashboard → Workers → 你的 Worker → Settings → Variables 中添加为 Secret）
4. **配置订阅源**：通过 KV 存储配置（键名：`config:sources`）
5. **配置手动代理**：通过 KV 存储配置（键名：`config:proxies`，可选）

### 生成 Auth Token

```bash
# 生成 48 位十六进制随机 Token（192 bit 熵）
pnpm gen

# 写入 Worker secret
npx wrangler secret put AUTH_TOKEN
```

Token 无过期时间；泄露或需更换时，重新生成并 `secret put` 覆盖即可（旧 Token 立即失效）。

## 部署

### Cloudflare Workers Git 集成（推荐）

1. 在 Cloudflare Dashboard → Workers → Pages 中连接 GitHub 仓库
2. 选择 `worker` 分支
3. 配置构建和部署：
   - **构建命令**：`pnpm install`
   - **部署命令**：`npx wrangler deploy`
4. 设置环境变量和 KV 绑定

### 手动部署

```bash
# 登录 Cloudflare
wrangler login

# 部署（注意：pnpm v10 下必须用 run，直接 `pnpm deploy` 是内置 workspace 命令）
pnpm run deploy
```

## API 文档

### 健康检查

```bash
GET /health
```

响应：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 获取清洗后的订阅

```bash
GET /subscription
Authorization: Bearer <token>
```

或

```bash
GET /subscription?token=<token>
```

响应：YAML 格式的代理配置（包含手动代理 + 清洗后的订阅节点，手动代理在前）

### 获取原始订阅

```bash
GET /subscription/raw?token=<token>
```

## 项目结构

```
├── src/
│   ├── worker.ts              # Worker 入口
│   ├── config-worker.ts       # Worker 配置
│   ├── core/                  # 核心逻辑（parser, aggregator, cleaner）
│   ├── routes/                # 路由（subscription-worker）
│   ├── services/              # 服务层（subscription-worker, shared）
│   ├── storage/               # KV 存储适配器
│   ├── utils/                 # 工具（logger-worker）
│   └── middleware/            # 中间件（auth-worker, request-log）
├── tests/                     # 单元测试
└── wrangler.toml              # Workers 配置
```

## 配置说明

### 订阅源配置 (KV: config:sources)

通过 KV 存储配置订阅源，键名为 `config:sources`，存储格式为：

```json
{
  "sources": [
    {
      "tag": "订阅A",
      "url": "https://example.com/subscription",
      "protocol": "clash",
      "enabled": true,
      "prefix": "Master",
      "cacheEnabled": true,
      "cacheTtlDays": 30
    },
    {
      "tag": "订阅B",
      "url": "https://example.com/api/v1/client/new",
      "protocol": "vless",
      "enabled": true
    }
  ]
}
```

`protocol` 支持：`clash`、`trojan`、`ss`、`vless`。

### 手动代理配置 (KV: config:proxies)

通过 KV 存储配置手动代理节点，键名为 `config:proxies`，存储格式为：

```json
{
  "proxies": [
    {
      "name": "your-server",
      "type": "ss",
      "server": "your-server.com",
      "port": 443,
      "cipher": "aes-256-gcm",
      "password": "your-password"
    }
  ]
}
```

特点：

- 不经过清洗流程
- 放在订阅节点前面
- 即使订阅源为空也会返回

### wrangler.toml 配置

```toml
name = "subscription-cleaner"
main = "src/worker.ts"
compatibility_date = "2024-04-01"

[[kv_namespaces]]
binding = "SUBSCRIPTION_KV"
id = "your-kv-namespace-id"

[vars]
LOG_LEVEL = "info"

[observability]
enabled = true
head_sampling_rate = 1

# AUTH_TOKEN 通过 wrangler secret / Dashboard 设置，不要提交到 git
```

> 启用 `[observability]` 后，可在 Dashboard → Worker → Observability 查看调用日志（免费版保留 3 天，20 万条/天）。

## 常用命令

```bash
# 本地开发
pnpm dev

# 部署（注意：pnpm v10 下必须用 run，直接 `pnpm deploy` 是内置 workspace 命令）
pnpm run deploy

# 实时查看日志
npx wrangler tail subscription-cleaner

# 生成 Workers 类型
pnpm cf:typegen

# 测试
pnpm test

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm type-check
```

## 许可证

ISC