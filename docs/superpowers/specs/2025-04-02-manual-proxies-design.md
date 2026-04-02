# 手动代理节点支持设计文档

## 概述

支持从 `resources/proxies.yaml` 读取手动配置的代理节点，这些节点不经过清洗流程，直接放在清洗后的订阅节点前面返回。

## 背景

当前订阅服务只支持从远程订阅源获取代理节点。用户希望添加一种能力：手动配置一些固定的代理节点，这些节点不需要清洗，且优先级高于远程订阅的节点。

## 目标

1. 读取 `resources/proxies.yaml` 中的手动代理配置
2. 手动代理不经过清洗流程
3. 手动代理放在清洗后的节点前面
4. 文件不存在时静默忽略
5. 即使远程订阅没有可用节点，手动代理也要返回

## 设计

### 文件格式

`resources/proxies.yaml` 使用标准 Clash YAML 格式：

```yaml
proxies:
  - name: hotfree
    type: ss
    server: xxx.com
    port: 443
    cipher: aes-256-gcm
    password: password
```

### 架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ loadManualProxies│     │ aggregateSubscriptions│     │ 合并输出        │
│                 │     │                  │     │                 │
│ proxies.yaml    │────▶│  远程订阅 → 清洗   │────▶│ 手动 + 清洗后   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 接口变更

#### 新增函数

```typescript
// src/services/subscription.ts
/**
 * 加载手动配置的代理节点
 * @param resourcesDir 资源目录路径
 * @returns 手动代理节点列表，文件不存在返回空数组
 */
async function loadManualProxies(resourcesDir: string): Promise<ProxyNode[]>
```

#### 修改函数

```typescript
// 修改前
export async function aggregateSubscriptions(
  sources: SubscriptionSource[]
): Promise<ProxyNode[]>

// 修改后
export async function aggregateSubscriptions(
  sources: SubscriptionSource[],
  manualNodes: ProxyNode[] = []
): Promise<ProxyNode[]>
```

### 数据流

1. 路由层 `subscription.ts` 调用 `loadManualProxies`
2. 将手动代理传递给 `aggregateSubscriptions`
3. `aggregateSubscriptions` 先处理远程订阅并清洗
4. 返回合并结果：`[...manualNodes, ...cleanedNodes]`

### 错误处理

- `proxies.yaml` 不存在：返回空数组，记录 info 日志
- `proxies.yaml` 解析失败：记录 error 日志，返回空数组
- 格式错误（缺少 proxies 字段）：返回空数组

### 测试策略

1. 单元测试 `loadManualProxies`：
   - 文件存在且格式正确
   - 文件不存在
   - 文件解析错误
   - 空 proxies 列表

2. 集成测试 `aggregateSubscriptions`：
   - 只有手动代理
   - 只有远程订阅
   - 两者都有（验证顺序）

## 实现计划

1. 在 `src/services/subscription.ts` 中添加 `loadManualProxies` 函数
2. 修改 `aggregateSubscriptions` 函数支持手动代理参数
3. 修改 `src/routes/subscription.ts` 调用新的加载函数
4. 添加单元测试
5. 验证功能

## 兼容性

- 不修改现有订阅源配置格式
- 手动代理文件不存在时不影响现有功能
- 不需要修改类型定义（复用现有 ProxyNode 类型）
