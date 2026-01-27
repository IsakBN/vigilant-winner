import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from './api.js';
import type { ClaimResult, HeartbeatData, LogEntry, StatusUpdate } from './types.js';

describe('ApiClient', () => {
  const baseUrl = 'https://api.bundlenudge.com';
  const token = 'test-token-123';
  let client: ApiClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  const mockJsonResponse = (data: unknown): { ok: boolean; json: () => Promise<unknown> } => ({
    ok: true,
    json: () => Promise.resolve(data),
  });

  const mockErrorResponse = (status: number, message: string): { ok: boolean; status: number; text: () => Promise<string> } => ({
    ok: false,
    status,
    text: () => Promise.resolve(message),
  });

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new ApiClient(baseUrl, token);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('strips trailing slash from baseUrl', async () => {
      const clientWithSlash = new ApiClient('https://api.example.com/', token);
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
      await clientWithSlash.heartbeat({});
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/nodes/worker/heartbeat',
        expect.any(Object)
      );
    });
  });

  describe('claimJob', () => {
    const emptyResult: ClaimResult = { build: null, credentials: null, devices: [] };

    it('calls correct endpoint with POST method', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(emptyResult));
      await client.claimJob('worker-1', 'ios');
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/builds/worker/claim`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ workerId: 'worker-1', nodePool: 'ios' }),
        })
      );
    });

    it('returns parsed ClaimResult', async () => {
      const mockResult: ClaimResult = {
        build: {
          id: 'build-123', appId: 'app-456', status: 'queued', priority: 1,
          nodePool: 'default', timeoutMinutes: 30, gitUrl: 'https://github.com/test/repo',
          gitBranch: 'main', scheme: 'MyApp', configuration: 'Release', exportMethod: 'ad-hoc',
        },
        credentials: { issuerId: 'i1', keyId: 'k1', privateKey: 'pk', teamId: 't1' },
        devices: [{ udid: 'device-1', name: 'iPhone 14' }],
      };
      mockFetch.mockResolvedValueOnce(mockJsonResponse(mockResult));
      const result = await client.claimJob('worker-1');
      expect(result).toEqual(mockResult);
    });

    it('includes auth header', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(emptyResult));
      await client.claimJob('worker-1');
      const calls = mockFetch.mock.calls as [string, RequestInit][];
      const [, fetchOptions] = calls[0] ?? ['', {}];
      const headers = fetchOptions.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Bearer ${token}`);
    });
  });

  describe('updateStatus', () => {
    it('calls correct endpoint with build ID', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
      const update: StatusUpdate = { status: 'building', gitCommit: 'abc123' };
      await client.updateStatus('build-123', update);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/builds/worker/build-123/status`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify(update) })
      );
    });
  });

  describe('appendLog', () => {
    it('calls correct endpoint with logs array', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
      const logs: LogEntry[] = [
        { level: 'info', message: 'Starting build', phase: 'build' },
        { level: 'debug', message: 'Running xcodebuild' },
      ];
      await client.appendLog('build-123', logs);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/builds/worker/build-123/log`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ logs }) })
      );
    });
  });

  describe('heartbeat', () => {
    it('calls correct endpoint with heartbeat data', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
      const data: HeartbeatData = { cpuUsage: 45, memoryUsage: 60, status: 'online' };
      await client.heartbeat(data);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/nodes/worker/heartbeat`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify(data) })
      );
    });
  });

  describe('goOffline', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
      await client.goOffline();
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/nodes/worker/offline`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('reportBuildComplete', () => {
    it('calls correct endpoint with build stats', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}));
      await client.reportBuildComplete('build-123', 180000, true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/nodes/worker/build-complete`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ buildId: 'build-123', durationMs: 180000, success: true }),
        })
      );
    });
  });

  describe('uploadArtifact', () => {
    it('uses correct content type for binary upload', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });
      const data = Buffer.from('test artifact data');
      await client.uploadArtifact('builds/app-123/artifact.ipa', data);
      const calls = mockFetch.mock.calls as [string, RequestInit][];
      const [url, fetchOptions] = calls[0] ?? ['', {}];
      const headers = fetchOptions.headers as Record<string, string>;
      expect(url).toBe(`${baseUrl}/v1/bundles/upload`);
      expect(fetchOptions.method).toBe('POST');
      expect(headers['Content-Type']).toBe('application/octet-stream');
      expect(headers['X-Bundle-Key']).toBe('builds/app-123/artifact.ipa');
      expect(headers.Authorization).toBe(`Bearer ${token}`);
      expect(fetchOptions.body).toBe(data);
    });

    it('throws error on upload failure', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse(500, 'Storage error'));
      await expect(client.uploadArtifact('key', Buffer.from('test'))).rejects.toThrow(
        'Failed to upload artifact: Storage error'
      );
    });
  });

  describe('error handling', () => {
    it('throws error on 4xx responses', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse(401, 'Unauthorized'));
      await expect(client.claimJob('worker-1')).rejects.toThrow(
        'API request failed: 401 Unauthorized'
      );
    });

    it('throws error on 5xx responses', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse(500, 'Internal Server Error'));
      await expect(client.heartbeat({})).rejects.toThrow(
        'API request failed: 500 Internal Server Error'
      );
    });
  });
});
