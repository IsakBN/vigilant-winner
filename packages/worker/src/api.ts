/**
 * API Client for communicating with the BundleNudge API
 *
 * Provides methods for worker nodes to interact with the build queue,
 * report status updates, and upload artifacts.
 */

import type {
  ClaimResult,
  HeartbeatData,
  LogEntry,
  StatusUpdate,
} from './types.js';

/**
 * API client for worker-to-API communication
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  /**
   * Claim the next available build job from the queue
   */
  async claimJob(workerId: string, nodePool?: string): Promise<ClaimResult> {
    return this.request<ClaimResult>('/builds/worker/claim', {
      method: 'POST',
      body: JSON.stringify({ workerId, nodePool }),
    });
  }

  /**
   * Update the status of a build
   */
  async updateStatus(buildId: string, update: StatusUpdate): Promise<void> {
    await this.request(`/builds/worker/${buildId}/status`, {
      method: 'POST',
      body: JSON.stringify(update),
    });
  }

  /**
   * Append log entries to a build
   */
  async appendLog(buildId: string, logs: LogEntry[]): Promise<void> {
    await this.request(`/builds/worker/${buildId}/log`, {
      method: 'POST',
      body: JSON.stringify({ logs }),
    });
  }

  /**
   * Send heartbeat to report worker health
   */
  async heartbeat(data: HeartbeatData): Promise<void> {
    await this.request('/nodes/worker/heartbeat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Mark the worker as going offline
   */
  async goOffline(): Promise<void> {
    await this.request('/nodes/worker/offline', {
      method: 'POST',
    });
  }

  /**
   * Report build completion statistics
   */
  async reportBuildComplete(
    buildId: string,
    durationMs: number,
    success: boolean
  ): Promise<void> {
    await this.request('/nodes/worker/build-complete', {
      method: 'POST',
      body: JSON.stringify({ buildId, durationMs, success }),
    });
  }

  /**
   * Upload a build artifact to storage
   */
  async uploadArtifact(key: string, data: Buffer): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/bundles/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/octet-stream',
        'X-Bundle-Key': key,
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload artifact: ${error}`);
    }
  }

  /**
   * Make an authenticated request to the API
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };

    // Merge additional headers if provided
    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>;
      Object.assign(headers, optHeaders);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json() as Promise<T>;
  }
}
