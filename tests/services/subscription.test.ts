import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import type { ProxyNode, SubscriptionSource } from '../../src/core/types';
import { loadManualProxies, aggregateSubscriptions } from '../../src/services/subscription';

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

  it('should return empty array when file does not exist', async () => {
    const result = await loadManualProxies('/nonexistent/path');
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array when proxies list is empty', async () => {
    const yamlContent = 'proxies: []';
    await writeFile(join(TEST_DIR, 'proxies.yaml'), yamlContent);

    const result = await loadManualProxies(TEST_DIR);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when YAML is invalid', async () => {
    const invalidYaml = 'not: valid: yaml: [';
    await writeFile(join(TEST_DIR, 'proxies.yaml'), invalidYaml);

    const result = await loadManualProxies(TEST_DIR);

    expect(result).toHaveLength(0);
  });
});

describe('aggregateSubscriptions with manual proxies', () => {
  it('should put manual proxies before aggregated proxies', async () => {
    const manualNodes: ProxyNode[] = [
      { name: 'manual1', type: 'ss', server: '1.1.1.1', port: 443 },
    ];
    const sources: SubscriptionSource[] = []; // 空订阅源

    const result = await aggregateSubscriptions(sources, manualNodes);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('manual1');
  });
});
