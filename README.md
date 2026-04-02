# 订阅节点清洗服务

基于 Hono + TypeScript 的订阅节点清洗服务，支持 JWT 认证和多格式订阅解析。

## 功能特性

- 🔐 JWT Token 认证（支持 Header 和 Query 参数）
- 📡 多格式订阅解析（Clash YAML / Trojan / Shadowsocks）
- 🧹 节点清洗（去重、过滤无效节点）
- 🏷️ 自动标签前缀
- 📝 结构化日志（Pino）
- 🧪 完整单元测试覆盖

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET
```

### 配置订阅源

```bash
# 编辑 resources/sources.yaml 配置订阅源
```

### 生成 JWT Token

```bash
# 生成3个月有效期的token（默认）
./scripts/generate-token.sh

# 生成指定有效期的token
./scripts/generate-token.sh 6  # 6个月
./scripts/generate-token.sh 12 # 1年
```

### 开发模式

```bash
pnpm dev
```

### 生产部署

```bash
# 构建
pnpm build

# 部署 dist/ 到服务器
# 在服务器上安装生产依赖
npm ci --only=production

# 启动
node dist/index.js
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

响应：YAML格式的代理配置

### 获取原始订阅

```bash
GET /subscription/raw?token=<token>
```

## 项目结构

```
src/
├── core/          # 核心逻辑（解析器、聚合器、清洗器）
├── routes/        # HTTP路由
├── middleware/    # 中间件（认证、日志）
├── services/      # 业务服务
├── utils/         # 工具函数
└── index.ts       # 入口
```

## 测试

```bash
pnpm test
```

## 许可证

ISC
