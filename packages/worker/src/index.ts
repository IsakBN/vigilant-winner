#!/usr/bin/env node
/**
 * @bundlenudge/worker - Mac Build Worker Entry Point
 *
 * This worker runs on Mac nodes and processes iOS build jobs.
 * It polls the API for available jobs, executes builds, and uploads artifacts.
 */

import type { WorkerConfig } from './types.js';
import { BuildWorker } from './worker.js';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_NODE_POOL = 'default';
const DEFAULT_WORK_DIR = '/tmp/bundlenudge-builds';
const DEFAULT_POLL_INTERVAL = 5000;
const DEFAULT_HEARTBEAT_INTERVAL = 30000;

// =============================================================================
// Environment Validation
// =============================================================================

interface EnvValidationResult {
  success: true;
  config: WorkerConfig;
}

interface EnvValidationError {
  success: false;
  errors: string[];
}

type EnvResult = EnvValidationResult | EnvValidationError;

/**
 * Validates and parses environment variables into WorkerConfig
 */
export function validateEnvironment(): EnvResult {
  const apiUrl = process.env.WORKER_API_URL;
  const workerToken = process.env.WORKER_TOKEN;
  const workerId = process.env.WORKER_ID;

  // Collect validation errors
  const errors: string[] = [];
  if (!apiUrl) errors.push('WORKER_API_URL is required');
  if (!workerToken) errors.push('WORKER_TOKEN is required');
  if (!workerId) errors.push('WORKER_ID is required');

  // Return early with errors if validation failed
  if (!apiUrl || !workerToken || !workerId) {
    return { success: false, errors };
  }

  // Parse optional variables with defaults
  const nodePool = process.env.NODE_POOL ?? DEFAULT_NODE_POOL;
  const workDir = process.env.WORK_DIR ?? DEFAULT_WORK_DIR;
  const pollInterval = parseInterval(
    process.env.POLL_INTERVAL,
    DEFAULT_POLL_INTERVAL
  );
  const heartbeatInterval = parseInterval(
    process.env.HEARTBEAT_INTERVAL,
    DEFAULT_HEARTBEAT_INTERVAL
  );

  // TypeScript knows these are non-null after the guard
  const config: WorkerConfig = {
    apiUrl,
    workerToken,
    workerId,
    nodePool,
    pollInterval,
    heartbeatInterval,
    workDir,
  };

  return { success: true, config };
}

/**
 * Parses an interval string to a number with fallback
 */
function parseInterval(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
}

// =============================================================================
// Logging
// =============================================================================

/**
 * Logs configuration summary
 */
function logConfig(config: WorkerConfig): void {
  const separator = '='.repeat(50);
  console.log(separator);
  console.log('BundleNudge Mac Build Worker');
  console.log(separator);
  console.log(`Worker ID: ${config.workerId}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Node Pool: ${config.nodePool}`);
  console.log(`Poll Interval: ${config.pollInterval}ms`);
  console.log(`Heartbeat Interval: ${config.heartbeatInterval}ms`);
  console.log(`Work Directory: ${config.workDir}`);
  console.log(separator);
}

// =============================================================================
// Signal Handlers
// =============================================================================

/**
 * Sets up signal handlers for graceful shutdown
 */
export function setupSignalHandlers(worker: BuildWorker): void {
  const handleSignal = async (signal: string): Promise<void> => {
    console.log(`\nReceived ${signal}, shutting down...`);
    await worker.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void handleSignal('SIGINT'));
  process.on('SIGTERM', () => void handleSignal('SIGTERM'));
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Main entry point for the worker
 */
export async function main(): Promise<void> {
  // Validate environment
  const result = validateEnvironment();

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  const { config } = result;
  logConfig(config);

  // Create and start the worker
  const worker = new BuildWorker(config);
  setupSignalHandlers(worker);

  console.log('\nStarting worker...');
  await worker.start();
}

// =============================================================================
// Library Exports
// =============================================================================

// Export BuildWorker class for library usage
export { BuildWorker } from './worker.js';

// Export API client
export { ApiClient } from './api.js';

// Export execution utilities
export { exec, execSequence } from './exec.js';

// Export metrics utilities
export {
  getSystemMetrics,
  getCpuUsage,
  getMemoryUsage,
  getDiskUsage,
  getLoadAverage,
} from './metrics.js';

// Re-export types
export type {
  WorkerConfig,
  Build,
  BuildCredentials,
  TestDevice,
  ClaimResult,
  StatusUpdate,
  LogEntry,
  HeartbeatData,
  ExecOptions,
  ExecResult,
  ExecSequenceResult,
  SigningConfig,
  SigningInfo,
} from './types.js';

// =============================================================================
// Entry Point Guard
// =============================================================================

// Run main if this is the entry point
const isMainModule = process.argv[1]?.endsWith('index.js');
if (isMainModule) {
  main().catch((error: unknown) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
