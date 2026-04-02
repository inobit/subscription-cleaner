# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Hono + TypeScript 的订阅节点清洗服务，用于聚合多个代理订阅源，去重过滤后输出统一格式的 Clash YAML 配置。

## 常用命令

```bash
# 开发模式（热重载）
pnpm dev

# 类型检查
pnpm type-check

# 运行测试
pnpm test

# 运行单个测试文件
pnpm vitest run tests/core/parser/clash.test.ts

# 持续监听测试
pnpm test:watch

# 代码检查
pnpm lint

# 自动修复代码风格
pnpm lint:fix

# 构建生产版本（输出到 dist/）
pnpm build

# 启动生产服务
pnpm start

# 生成 JWT Token（开发模式）
pnpm gen:token:dev

# 生成 JWT Token（生产模式，需先 build）
pnpm gen:token
```

## 架构概览

### 技术栈

- **框架**: Hono (轻量级 Web 框架)
- **运行时**: Node.js 20+
- **语言**: TypeScript (ES2022, ES Modules)
- **构建**: Vite (SSR 模式，保留模块结构)
- **测试**: Vitest
- **日志**: Pino + pino-pretty

### 目录结构

```
├── src/                  # 源码
│   ├── index.ts          # 入口：启动 HTTP 服务
│   ├── config.ts         # 配置加载（环境变量）
│   ├── core/             # 核心领域逻辑
│   │   ├── types.ts      # 类型定义（ProxyNode, ClashConfig 等）
│   │   ├── parser/       # 协议解析器（Clash/Trojan/Shadowsocks）
│   │   ├── aggregator.ts # 订阅聚合器
│   │   └── cleaner.ts    # 节点清洗去重
│   ├── routes/           # HTTP 路由
│   ├── middleware/       # Hono 中间件（认证、日志）
│   ├── services/         # 业务服务层
│   └── utils/            # 工具函数（日志、JWT）
├── tests/                # 单元测试
├── resources/            # 运行时配置
│   └── sources.yaml      # 订阅源配置
├── tools/                # 运维部署工具
│   ├── deploy.sh         # 自动化部署脚本
│   └── subscription-cleaner.service.example  # systemd 服务模板
├── scripts/              # 应用内脚本
│   └── generate-token.ts # JWT Token 生成工具
└── dist/                 # 构建产物
```

### 核心流程

1. **配置加载**: `config.ts` 从环境变量读取配置，生产环境强制要求 `JWT_SECRET`
2. **订阅聚合**: `services/subscription.ts` → `core/aggregator.ts` 并发拉取多个订阅源
3. **协议解析**: `core/parser/` 下的解析器将不同格式转为统一 `ProxyNode` 结构
4. **节点清洗**: `core/cleaner.ts` 去重、过滤无效节点
5. **输出**: 统一输出 Clash YAML 格式

### 关键配置

- **订阅源配置**: `resources/sources.yaml` - 配置多个订阅源的 URL、协议类型、标签前缀
- **环境变量**: 复制 `.env.example` 到 `.env`，必须设置 `JWT_SECRET`
- **JWT Token 生成**: 开发使用 `pnpm gen:token:dev`，生产使用 `pnpm gen:token`（需先 build）

### 认证机制

- 订阅接口需要 JWT Token 认证
- Token 可通过 Header (`Authorization: Bearer <token>`) 或 Query 参数 (`?token=<token>`) 传递
- Token 有效期在生成时指定（默认 3 个月）

### 测试结构

测试文件与源码结构对应：
- `tests/core/parser/*.test.ts` - 解析器单元测试
- `tests/middleware/auth.test.ts` - 认证中间件测试
- 使用 Vitest，支持 `describe`/`it`/`expect` 语法

## 部署说明

### 发布 Release

推送标签触发 GitHub Actions 构建：

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 服务器部署

```bash
# 一键部署（推荐）
curl -fsSL https://github.com/inobit/subscription-cleaner/releases/latest/download/deploy.sh | sudo bash

# 按提示修改 .env 和 resources/sources.yaml 后启动
sudo systemctl start subscription-cleaner
```

部署脚本位置：`tools/deploy.sh`
服务模板位置：`tools/subscription-cleaner.service.example`
