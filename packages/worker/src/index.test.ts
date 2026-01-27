/**
 * Tests for worker entry point
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnvironment, setupSignalHandlers } from './index.js';
import type { BuildWorker } from './worker.js';

// =============================================================================
// Test Helpers
// =============================================================================

function setEnv(vars: Record<string, string>): void {
  for (const [key, value] of Object.entries(vars)) {
    process.env[key] = value;
  }
}

function clearEnv(): void {
  delete process.env.WORKER_API_URL;
  delete process.env.WORKER_TOKEN;
  delete process.env.WORKER_ID;
  delete process.env.NODE_POOL;
  delete process.env.WORK_DIR;
  delete process.env.POLL_INTERVAL;
  delete process.env.HEARTBEAT_INTERVAL;
}

// =============================================================================
// Environment Validation Tests
// =============================================================================

describe('validateEnvironment', () => {
  beforeEach(() => {
    clearEnv();
  });

  afterEach(() => {
    clearEnv();
  });

  it('should fail when WORKER_API_URL is missing', () => {
    setEnv({
      WORKER_TOKEN: 'token',
      WORKER_ID: 'worker-1',
    });

    const result = validateEnvironment();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('WORKER_API_URL is required');
    }
  });

  it('should fail when WORKER_TOKEN is missing', () => {
    setEnv({
      WORKER_API_URL: 'https://api.example.com',
      WORKER_ID: 'worker-1',
    });

    const result = validateEnvironment();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('WORKER_TOKEN is required');
    }
  });

  it('should fail when WORKER_ID is missing', () => {
    setEnv({
      WORKER_API_URL: 'https://api.example.com',
      WORKER_TOKEN: 'token',
    });

    const result = validateEnvironment();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('WORKER_ID is required');
    }
  });

  it('should fail with multiple errors when multiple vars are missing', () => {
    const result = validateEnvironment();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('WORKER_API_URL is required');
      expect(result.errors).toContain('WORKER_TOKEN is required');
      expect(result.errors).toContain('WORKER_ID is required');
    }
  });

  it('should succeed with all required vars', () => {
    setEnv({
      WORKER_API_URL: 'https://api.example.com',
      WORKER_TOKEN: 'token',
      WORKER_ID: 'worker-1',
    });

    const result = validateEnvironment();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.apiUrl).toBe('https://api.example.com');
      expect(result.config.workerToken).toBe('token');
      expect(result.config.workerId).toBe('worker-1');
    }
  });

  it('should use default values for optional vars', () => {
    setEnv({
      WORKER_API_URL: 'https://api.example.com',
      WORKER_TOKEN: 'token',
      WORKER_ID: 'worker-1',
    });

    const result = validateEnvironment();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.nodePool).toBe('default');
      expect(result.config.workDir).toBe('/tmp/bundlenudge-builds');
      expect(result.config.pollInterval).toBe(5000);
      expect(result.config.heartbeatInterval).toBe(30000);
    }
  });

  it('should use custom values for optional vars', () => {
    setEnv({
      WORKER_API_URL: 'https://api.example.com',
      WORKER_TOKEN: 'token',
      WORKER_ID: 'worker-1',
      NODE_POOL: 'ios-pool',
      WORK_DIR: '/custom/builds',
      POLL_INTERVAL: '10000',
      HEARTBEAT_INTERVAL: '60000',
    });

    const result = validateEnvironment();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.nodePool).toBe('ios-pool');
      expect(result.config.workDir).toBe('/custom/builds');
      expect(result.config.pollInterval).toBe(10000);
      expect(result.config.heartbeatInterval).toBe(60000);
    }
  });

  it('should use defaults for invalid interval values', () => {
    setEnv({
      WORKER_API_URL: 'https://api.example.com',
      WORKER_TOKEN: 'token',
      WORKER_ID: 'worker-1',
      POLL_INTERVAL: 'invalid',
      HEARTBEAT_INTERVAL: '-100',
    });

    const result = validateEnvironment();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.pollInterval).toBe(5000);
      expect(result.config.heartbeatInterval).toBe(30000);
    }
  });
});

// =============================================================================
// Signal Handler Tests
// =============================================================================

describe('setupSignalHandlers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register SIGINT and SIGTERM handlers', () => {
    const processOnSpy = vi.spyOn(process, 'on');
    const mockWorker = {
      stop: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
    } as unknown as BuildWorker;

    setupSignalHandlers(mockWorker);

    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });
});
