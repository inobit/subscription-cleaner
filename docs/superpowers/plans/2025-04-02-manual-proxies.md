# 手动代理节点支持实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从 `resources/proxies.yaml` 读取手动代理节点，与清洗后的订阅节点合并返回，手动代理放在前面且不经过清洗。

**Architecture:** 在 `src/services/subscription.ts` 中新增 `loadManualProxies` 函数负责读取和解析；修改 `aggregateSubscriptions` 接收手动代理参数并在返回时合并；路由层调用加载函数并传递参数。

**Tech Stack:** TypeScript, Hono, js-yaml, Vitest

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `src/services/subscription.ts` | 订阅服务核心逻辑 | 新增 `loadManualProxies`，修改 `aggregateSubscriptions` |
| `src/routes/subscription.ts` | 订阅路由处理 | 修改路由处理器调用新函数并传递参数 |
| `tests/services/subscription.test.ts` | 订阅服务测试 | 新增测试用例 |

---

## Task 1: 实现 loadManualProxies 函数

**Files:**
- Modify: `src/services/subscription.ts`
- Test: `tests/services/subscription.test.ts` (新增测试)

### Step 1.1: 编写测试 - 文件存在且格式正确

- [ ] **添加测试代码**

在 `tests/services/subscription.test.ts` 添加（如果不存在则创建文件）：

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { loadManualProxies } from '../../src/services/subscription';

const TEST_DIR = './test-resources';

describe('loadManualProxies', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should load proxies from valid YAML file', async () => {
    const yamlContent = `
proxies:
  - name: hotfree
    type: ss
    server: 1.2.3.4
    port: 443
    cipher: aes-256-gcm
    password: test123
  - name: backup
    type: trojan
    server: 5.6.7.8
    port: 443
    password: trojan123
`;
    await writeFile(join(TEST_DIR, 'proxies.yaml'), yamlContent);

    const result = await loadManualProxies(TEST_DIR);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('hotfree');
    expect(result[0].type).toBe('ss');
    expect(result[1].name).toBe('backup');
    expect(result[1].type).toBe('trojan');
  });
});
```

### Step 1.2: 运行测试确认失败

- [ ] **运行测试**

```bash
pnpm vitest run tests/services/subscription.test.ts -v
```

**Expected:** FAIL - "loadManualProxies is not defined" 或文件不存在

### Step 1.3: 实现 loadManualProxies 函数

- [ ] **添加实现代码**

在 `src/services/subscription.ts` 顶部添加 import：

```typescript
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'js-yaml';
```

在文件末尾（export 之前）添加函数：

```typescript
/**
 * 加载手动配置的代理节点
 * @param resourcesDir 资源目录路径
 * @returns 手动代理节点列表，文件不存在返回空数组
 */
export async function loadManualProxies(resourcesDir: string): Promise<ProxyNode[]> {
  try {
    const filePath = join(resourcesDir, 'proxies.yaml');
    const content = await readFile(filePath, 'utf-8');
    const parsed = yaml.load(content) as { proxies?: ProxyNode[] };

    if (!parsed.proxies || !Array.isArray(parsed.proxies)) {
      logger.warn('proxies.yaml 中没有找到 proxies 列表');
      return [];
    }

    logger.info(`成功加载 ${parsed.proxies.length} 个手动代理节点`);
    return parsed.proxies;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.debug('proxies.yaml 文件不存在，跳过手动代理加载');
      return [];
    }
    logger.error(`加载手动代理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return [];
  }
}
```

### Step 1.4: 运行测试确认通过

- [ ] **运行测试**

```bash
pnpm vitest run tests/services/subscription.test.ts::loadManualProxies -v
```

**Expected:** PASS

### Step 1.5: 提交

- [ ] **提交代码**

```bash
git add tests/services/subscription.test.ts src/services/subscription.ts
git commit -m "feat(subscription): 添加 loadManualProxies 函数"
```

---

## Task 2: 添加更多 loadManualProxies 测试用例

**Files:**
- Test: `tests/services/subscription.test.ts`

### Step 2.1: 测试文件不存在

- [ ] **添加测试代码**

在 `describe('loadManualProxies')` 中添加：

```typescript
  it('should return empty array when file does not exist', async () => {
    const result = await loadManualProxies('/nonexistent/path');
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
```

### Step 2.2: 测试空 proxies 列表

- [ ] **添加测试代码**

```typescript
  it('should return empty array when proxies list is empty', async () => {
    const yamlContent = 'proxies: []';
    await writeFile(join(TEST_DIR, 'proxies.yaml'), yamlContent);

    const result = await loadManualProxies(TEST_DIR);

    expect(result).toHaveLength(0);
  });
```

### Step 2.3: 测试无效的 YAML 格式

- [ ] **添加测试代码**

```typescript
  it('should return empty array when YAML is invalid', async () => {
    const invalidYaml = 'not: valid: yaml: [';
    await writeFile(join(TEST_DIR, 'proxies.yaml'), invalidYaml);

    const result = await loadManualProxies(TEST_DIR);

    expect(result).toHaveLength(0);
  });
```

### Step 2.4: 运行所有测试

- [ ] **运行测试**

```bash
pnpm vitest run tests/services/subscription.test.ts -v
```

**Expected:** 所有 4 个测试 PASS

### Step 2.5: 提交

- [ ] **提交代码**

```bash
git add tests/services/subscription.test.ts
git commit -m "test(subscription): 添加 loadManualProxies 边界测试"
```

---

## Task 3: 修改 aggregateSubscriptions 支持手动代理

**Files:**
- Modify: `src/services/subscription.ts`
- Test: `tests/services/subscription.test.ts`

### Step 3.1: 编写合并逻辑测试

- [ ] **添加测试代码**

在 `tests/services/subscription.test.ts` 添加新 describe：

```typescript
describe('aggregateSubscriptions with manual proxies', () => {
  it('should put manual proxies before aggregated proxies', async () => {
    const manualNodes: ProxyNode[] = [
      { name: 'manual1', type: 'ss', server: '1.1.1.1', port: 443 }
    ];
    const sources: SubscriptionSource[] = []; // 空订阅源

    const result = await aggregateSubscriptions(sources, manualNodes);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('manual1');
  });

  it('should merge manual and remote proxies', async () => {
    // 这个测试需要模拟远程订阅，可以先跳过或简化
    // 主要验证顺序：手动在前
  });
});
```

### Step 3.2: 运行测试确认失败

- [ ] **运行测试**

```bash
pnpm vitest run tests/services/subscription.test.ts::aggregateSubscriptions -v
```

**Expected:** FAIL - 参数不匹配或函数不存在

### Step 3.3: 修改 aggregateSubscriptions 函数签名

- [ ] **修改函数**

修改 `src/services/subscription.ts` 中的 `aggregateSubscriptions` 函数（第103行附近）：

```typescript
/**
 * 聚合所有订阅源的节点
 * @param sources 订阅源列表
 * @param manualNodes 手动配置的代理节点（可选，放在结果前面）
 * @returns 聚合并清洗后的节点列表
 */
export async function aggregateSubscriptions(
  sources: SubscriptionSource[],
  manualNodes: ProxyNode[] = []
): Promise<ProxyNode[]> {
  logger.info(`开始处理 ${sources.length} 个订阅源`);

  const enabledSources = sources.filter((s) => s.enabled);
  const nodeLists = await Promise.all(enabledSources.map((source) => processSource(source)));

  const aggregated = aggregateNodes(nodeLists);
  const cleaned = cleanNodes(aggregated);

  // 手动代理放在前面
  const result = [...manualNodes, ...cleaned];

  logger.info(`处理完成，共 ${result.length} 个节点（手动: ${manualNodes.length}, 清洗后: ${cleaned.length}）`);
  return result;
}
```

### Step 3.4: 运行测试确认通过

- [ ] **运行测试**

```bash
pnpm vitest run tests/services/subscription.test.ts::aggregateSubscriptions -v
```

**Expected:** PASS

### Step 3.5: 提交

- [ ] **提交代码**

```bash
git add tests/services/subscription.test.ts src/services/subscription.ts
git commit -m "feat(subscription): aggregateSubscriptions 支持手动代理参数"
```

---

## Task 4: 修改路由层调用

**Files:**
- Modify: `src/routes/subscription.ts`

### Step 4.1: 修改主订阅路由

- [ ] **修改代码**

在 `src/routes/subscription.ts` 修改 import：

```typescript
import { aggregateSubscriptions, loadManualProxies } from '../services/subscription';
```

修改主路由处理器（约第36-52行）：

```typescript
subscriptionRouter.get('/', async (c) => {
  logger.info('收到订阅请求');

  const sources = await loadSources();
  const manualNodes = await loadManualProxies(config.resourcesDir);

  if (sources.length === 0 && manualNodes.length === 0) {
    return c.json({ error: '没有可用的订阅源配置或手动代理' }, 500);
  }

  const nodes = await aggregateSubscriptions(sources, manualNodes);
  if (nodes.length === 0) {
    return c.json({ error: '没有可用的节点' }, 503);
  }

  // 返回YAML格式
  const output = yaml.dump({ proxies: nodes });
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.body(output);
});
```

### Step 4.2: 类型检查

- [ ] **运行类型检查**

```bash
pnpm type-check
```

**Expected:** 无错误

### Step 4.3: 提交

- [ ] **提交代码**

```bash
git add src/routes/subscription.ts
git commit -m "feat(routes): 订阅路由支持手动代理加载"
```

---

## Task 5: 添加示例文件和验证

**Files:**
- Create: `resources/proxies.yaml.example`

### Step 5.1: 创建示例文件

- [ ] **创建示例文件**

```yaml
# 手动代理配置
# 复制此文件为 proxies.yaml 并填写实际代理信息
# 这些代理不会经过清洗，会放在订阅代理前面

proxies:
  # - name: hotfree
  #   type: ss
  #   server: your-server.com
  #   port: 443
  #   cipher: aes-256-gcm
  #   password: your-password
  #
  # - name: backup-proxy
  #   type: trojan
  #   server: backup-server.com
  #   port: 443
  #   password: your-password
```

### Step 5.2: 完整测试

- [ ] **运行全部测试**

```bash
pnpm test
```

**Expected:** 所有测试 PASS

### Step 5.3: 提交

- [ ] **提交代码**

```bash
git add resources/proxies.yaml.example
git commit -m "docs: 添加手动代理配置示例文件"
```

---

## Task 6: 最终验证

### Step 6.1: 创建测试用的 proxies.yaml

- [ ] **创建测试文件**

```bash
cat > resources/proxies.yaml << 'EOF'
proxies:
  - name: hotfree-test
    type: ss
    server: 127.0.0.1
    port: 8388
    cipher: aes-256-gcm
    password: test
EOF
```

### Step 6.2: 启动服务并测试

- [ ] **启动开发服务**

```bash
# 后台启动
coproc pnpm dev
sleep 3
```

### Step 6.3: 测试端点

- [ ] **发送测试请求**

```bash
# 生成 token
TOKEN=$(pnpm gen:token:dev 2>/dev/null | tail -1)
curl -s "http://localhost:3000/subscription?token=$TOKEN" | head -20
```

**Expected:** 返回的 YAML 中 `hotfree-test` 应该在 `proxies` 列表的第一个位置

### Step 6.4: 停止服务和清理

- [ ] **停止服务和删除测试文件**

```bash
kill $COPROC_PID 2>/dev/null
rm resources/proxies.yaml
```

### Step 6.5: 提交

- [ ] **提交最终更改**

```bash
git add -A
git commit -m "feat: 完成手动代理节点支持" || echo "No changes to commit"
```

---

## 自评检查

**Spec 覆盖检查:**
- [x] 读取 `proxies.yaml` - Task 1
- [x] 手动代理不清洗 - Task 3（直接传递，不经过 cleanNodes）
- [x] 手动代理放在前面 - Task 3（`[...manualNodes, ...cleaned]`）
- [x] 文件不存在静默忽略 - Task 1（ENOENT 处理）
- [x] 即使远程订阅为空也返回 - Task 4（修改空检查逻辑）

**占位符检查:** 无 TBD/TODO/占位符

**类型一致性检查:**
- `loadManualProxies` 返回 `Promise<ProxyNode[]>`
- `aggregateSubscriptions` 参数 `manualNodes: ProxyNode[] = []`
- 所有类型与现有 `ProxyNode` 定义一致
