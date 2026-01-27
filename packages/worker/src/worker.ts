/**
 * Build Worker - Main worker class for processing iOS builds
 *
 * Polls the API for available jobs, executes builds, and reports results.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ApiClient } from './api.js';
import { executeBuild } from './builder.js';
import { getSystemMetrics } from './metrics.js';
import type { WorkerConfig, Build } from './types.js';

/**
 * Build worker that processes jobs from the queue
 */
export class BuildWorker {
  private config: WorkerConfig;
  private api: ApiClient;
  private running = false;
  private currentBuild: Build | null = null;
  private buildStartTime: number | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: WorkerConfig) {
    this.config = config;
    this.api = new ApiClient(config.apiUrl, config.workerToken);
  }

  /**
   * Start the worker polling loop
   */
  async start(): Promise<void> {
    this.running = true;
    console.log(`Worker started (pool: ${this.config.nodePool}), polling...`);

    this.startHeartbeat();

    while (this.running) {
      try {
        await this.poll();
      } catch (error) {
        console.error('Poll error:', error);
      }

      if (this.running) {
        await this.sleep(this.config.pollInterval);
      }
    }
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    this.running = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.currentBuild) {
      console.log('Cancelling current build...');
      await this.api.updateStatus(this.currentBuild.id, {
        status: 'failed',
        errorMessage: 'Worker shutdown',
        errorCode: 'WORKER_SHUTDOWN',
      });
    }

    try {
      await this.api.goOffline();
      console.log('Worker marked offline');
    } catch (error) {
      console.error('Failed to mark offline:', error);
    }
  }

  /**
   * Start the heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      void this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const metrics = await getSystemMetrics();
      await this.api.heartbeat({
        ...metrics,
        status: this.currentBuild ? 'busy' : 'online',
        currentBuildId: this.currentBuild?.id,
      });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }

  /**
   * Poll for and process a single job
   */
  private async poll(): Promise<void> {
    const result = await this.api.claimJob(
      this.config.workerId,
      this.config.nodePool
    );

    if (!result.build) {
      process.stdout.write('.');
      return;
    }

    console.log(`\nClaimed build: ${result.build.id}`);
    this.currentBuild = result.build;
    this.buildStartTime = Date.now();

    let success = false;
    try {
      await executeBuild(
        this.api,
        result.build,
        result.credentials,
        result.devices,
        this.config.workDir
      );
      success = true;
    } catch (error) {
      console.error('Build failed:', error);
      await this.api.updateStatus(result.build.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'BUILD_ERROR',
      });
    } finally {
      if (this.buildStartTime) {
        const durationMs = Date.now() - this.buildStartTime;
        try {
          await this.api.reportBuildComplete(result.build.id, durationMs, success);
        } catch {
          // Ignore completion report errors
        }
      }

      this.currentBuild = null;
      this.buildStartTime = null;
      await this.cleanup();
    }
  }

  /**
   * Clean up work directory
   */
  private async cleanup(): Promise<void> {
    try {
      const entries = await fs.readdir(this.config.workDir);
      for (const entry of entries) {
        const entryPath = path.join(this.config.workDir, entry);
        await fs.rm(entryPath, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
