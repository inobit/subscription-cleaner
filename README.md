# 订阅节点清洗服务

基于 Hono + TypeScript 的订阅节点清洗服务，支持 JWT 认证和多格式订阅解析。

## 功能特性

- 🔐 JWT Token 认证（支持 Header 和 Query 参数）
- 📡 多格式订阅解析（Clash YAML / Trojan / Shadowsocks）
- 🧹 节点清洗（去重、过滤无效节点）
- 🏷️ 自动标签前缀
- 📝 手动代理配置（支持本地 YAML 文件，不经过清洗）
- 📝 结构化日志（Pino）
- 🧪 完整单元测试覆盖

## 快速开始

### 开发环境

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET

# 配置订阅源
cp resources/sources.yaml.example resources/sources.yaml
# 编辑 resources/sources.yaml 配置订阅源

# 配置手动代理（可选）
cp resources/proxies.yaml.example resources/proxies.yaml
# 编辑 resources/proxies.yaml 添加手动代理节点

# 开发模式启动
pnpm dev
```

### 生成 JWT Token

```bash
# 开发模式
pnpm gen:token:dev

# 生产模式（需先构建）
pnpm build
pnpm gen:token
```

## 部署

### 一键部署（推荐）

```bash
curl -fsSL https://github.com/inobit/subscription-cleaner/releases/latest/download/deploy.sh | bash
```

部署完成后，按提示修改配置文件，然后启动服务。

### 手动部署

```bash
# 下载最新 release
wget https://github.com/inobit/subscription-cleaner/releases/latest/download/subscription-cleaner-v1.x.x.tar.gz
tar -xzf subscription-cleaner-v1.x.x.tar.gz -C /opt/

# 配置
cd /opt/subscription-cleaner
cp .env.example .env
cp resources/sources.yaml.example resources/sources.yaml
cp resources/proxies.yaml.example resources/proxies.yaml  # 可选：手动代理
# 编辑配置文件

# 安装 systemd 服务
sudo ln -sf /opt/subscription-cleaner/tools/subscription-cleaner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now subscription-cleaner
```

### 构建 Release

```bash
# 推送标签触发 GitHub Actions 构建
git tag v1.0.0
git push origin v1.0.0
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
├── src/              # 源码
├── tests/            # 单元测试
├── resources/        # 运行时配置
│   ├── sources.yaml           # 订阅源配置
│   ├── sources.yaml.example   # 订阅源示例
│   ├── proxies.yaml           # 手动代理配置（可选）
│   └── proxies.yaml.example   # 手动代理示例
├── tools/            # 部署工具（deploy.sh、systemd 服务）
├── scripts/          # 应用脚本（generate-token）
└── dist/             # 构建产物
```

## 配置说明

### 订阅源配置 (resources/sources.yaml)

配置远程订阅源：

```yaml
sources:
  - tag: '订阅A'
    url: 'https://example.com/subscription'
    protocol: 'clash'
    enabled: true
    prefix: 'Master'
    cacheEnabled: true
    cacheTtlDays: 30
```

### 手动代理配置 (resources/proxies.yaml)

配置本地手动代理节点（不经过清洗，放在订阅节点前面）：

```yaml
proxies:
  - name: your-server
    type: ss
    server: your-server.com
    port: 443
    cipher: aes-256-gcm
    password: your-password
```

特点：

- 不经过清洗流程
- 放在订阅节点前面
- 即使订阅源为空也会返回

## 常用命令

```bash
# 开发
pnpm dev

# 测试
pnpm test

# 构建
pnpm build

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm type-check
```

## 许可证

ISC
