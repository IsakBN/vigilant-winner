import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Build, WorkerConfig } from './types.js';

// Create mock instances that we can control
const mockApiClient = {
  claimJob: vi.fn(),
  updateStatus: vi.fn(),
  appendLog: vi.fn(),
  heartbeat: vi.fn(),
  goOffline: vi.fn(),
  reportBuildComplete: vi.fn(),
  uploadArtifact: vi.fn(),
};

const mockExecuteBuild = vi.fn();
const mockGetSystemMetrics = vi.fn();
const mockFs = {
  readdir: vi.fn(),
  rm: vi.fn(),
};

// Mock modules before importing BuildWorker
vi.mock('./api.js', () => ({
  ApiClient: vi.fn().mockImplementation(() => mockApiClient),
}));

vi.mock('./builder.js', () => ({
  executeBuild: (...args: unknown[]): Promise<void> => mockExecuteBuild(...args) as Promise<void>,
}));

vi.mock('./metrics.js', () => ({
  getSystemMetrics: (): Promise<unknown> => mockGetSystemMetrics() as Promise<unknown>,
}));

vi.mock('fs/promises', () => ({
  readdir: (...args: unknown[]): Promise<string[]> => mockFs.readdir(...args) as Promise<string[]>,
  rm: (...args: unknown[]): Promise<void> => mockFs.rm(...args) as Promise<void>,
}));

// Import after mocks are set up
import { BuildWorker } from './worker.js';
import { ApiClient } from './api.js';

// Helper type for accessing private methods
interface WorkerPrivate {
  running: boolean;
  currentBuild: Build | null;
  buildStartTime: number | null;
  heartbeatTimer: NodeJS.Timeout | null;
  config: WorkerConfig;
  api: typeof mockApiClient;
  poll: () => Promise<void>;
  cleanup: () => Promise<void>;
  sleep: (ms: number) => Promise<void>;
  startHeartbeat: () => void;
}

describe('BuildWorker', () => {
  let config: WorkerConfig;
  let worker: BuildWorker;
  let workerPrivate: WorkerPrivate;

  const createMockBuild = (overrides: Partial<Build> = {}): Build => ({
    id: 'build-123',
    appId: 'app-456',
    status: 'queued',
    priority: 1,
    nodePool: 'ios',
    timeoutMinutes: 30,
    gitUrl: 'https://github.com/test/repo',
    gitBranch: 'main',
    scheme: 'MyApp',
    configuration: 'Release',
    exportMethod: 'ad-hoc',
    ...overrides,
  });

  const defaultMetrics = {
    cpuUsage: 25,
    memoryUsage: 50,
    diskUsage: 40,
    loadAverage: 1.5,
  };

  beforeEach(() => {
    config = {
      apiUrl: 'https://api.bundlenudge.com',
      workerToken: 'test-token',
      workerId: 'worker-1',
      nodePool: 'ios',
      pollInterval: 5000,
      heartbeatInterval: 30000,
      workDir: '/tmp/builds',
    };

    vi.clearAllMocks();

    // Set default mock implementations
    mockGetSystemMetrics.mockResolvedValue(defaultMetrics);
    mockExecuteBuild.mockResolvedValue(undefined);
    mockApiClient.claimJob.mockResolvedValue({ build: null, credentials: null, devices: [] });
    mockApiClient.updateStatus.mockResolvedValue(undefined);
    mockApiClient.appendLog.mockResolvedValue(undefined);
    mockApiClient.heartbeat.mockResolvedValue(undefined);
    mockApiClient.goOffline.mockResolvedValue(undefined);
    mockApiClient.reportBuildComplete.mockResolvedValue(undefined);
    mockApiClient.uploadArtifact.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.rm.mockResolvedValue(undefined);

    worker = new BuildWorker(config);
    workerPrivate = worker as unknown as WorkerPrivate;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('creates ApiClient with config', () => {
      expect(ApiClient).toHaveBeenCalledWith(config.apiUrl, config.workerToken);
    });

    it('initializes with running false', () => {
      expect(workerPrivate.running).toBe(false);
    });

    it('initializes with no current build', () => {
      expect(workerPrivate.currentBuild).toBeNull();
    });
  });

  describe('stop', () => {
    it('sets running to false', async () => {
      workerPrivate.running = true;
      await worker.stop();
      expect(workerPrivate.running).toBe(false);
    });

    it('clears heartbeat timer', async () => {
      vi.useFakeTimers();
      const timer = setInterval((): void => undefined, 1000);
      workerPrivate.heartbeatTimer = timer;

      await worker.stop();

      expect(workerPrivate.heartbeatTimer).toBeNull();
    });

    it('calls goOffline on API', async () => {
      await worker.stop();
      expect(mockApiClient.goOffline).toHaveBeenCalled();
    });

    it('marks current build as failed on shutdown', async () => {
      const build = createMockBuild();
      workerPrivate.currentBuild = build;

      await worker.stop();

      expect(mockApiClient.updateStatus).toHaveBeenCalledWith(build.id, {
        status: 'failed',
        errorMessage: 'Worker shutdown',
        errorCode: 'WORKER_SHUTDOWN',
      });
    });

    it('handles goOffline errors gracefully', async () => {
      mockApiClient.goOffline.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation((): void => undefined);

      await worker.stop();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to mark offline:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('startHeartbeat', () => {
    it('sends metrics with online status when idle', async () => {
      vi.useFakeTimers();

      workerPrivate.startHeartbeat();
      await vi.advanceTimersByTimeAsync(config.heartbeatInterval);

      expect(mockGetSystemMetrics).toHaveBeenCalled();
      expect(mockApiClient.heartbeat).toHaveBeenCalledWith({
        ...defaultMetrics,
        status: 'online',
        currentBuildId: undefined,
      });
    });

    it('sends metrics with busy status when building', async () => {
      vi.useFakeTimers();
      const build = createMockBuild();
      workerPrivate.currentBuild = build;

      workerPrivate.startHeartbeat();
      await vi.advanceTimersByTimeAsync(config.heartbeatInterval);

      expect(mockApiClient.heartbeat).toHaveBeenCalledWith({
        ...defaultMetrics,
        status: 'busy',
        currentBuildId: build.id,
      });
    });

    it('handles heartbeat errors gracefully', async () => {
      vi.useFakeTimers();
      mockApiClient.heartbeat.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation((): void => undefined);

      workerPrivate.startHeartbeat();
      await vi.advanceTimersByTimeAsync(config.heartbeatInterval);

      expect(consoleSpy).toHaveBeenCalledWith('Heartbeat failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('poll', () => {
    it('claims job with workerId and nodePool', async () => {
      await workerPrivate.poll();
      expect(mockApiClient.claimJob).toHaveBeenCalledWith(config.workerId, config.nodePool);
    });

    it('prints dot when no job available', async () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      await workerPrivate.poll();

      expect(writeSpy).toHaveBeenCalledWith('.');
      writeSpy.mockRestore();
    });

    it('calls executeBuild when job claimed', async () => {
      const build = createMockBuild();
      const credentials = { issuerId: 'i1', keyId: 'k1', privateKey: 'pk', teamId: 't1' };

      mockApiClient.claimJob.mockResolvedValueOnce({ build, credentials, devices: [] });

      await workerPrivate.poll();

      expect(mockExecuteBuild).toHaveBeenCalledWith(
        mockApiClient,
        build,
        credentials,
        [],
        config.workDir
      );
    });

    it('resets currentBuild after poll completes', async () => {
      const build = createMockBuild();
      const credentials = { issuerId: 'i1', keyId: 'k1', privateKey: 'pk', teamId: 't1' };

      mockApiClient.claimJob.mockResolvedValueOnce({ build, credentials, devices: [] });

      await workerPrivate.poll();

      expect(workerPrivate.currentBuild).toBeNull();
    });

    it('reports build completion on success', async () => {
      const build = createMockBuild();
      const credentials = { issuerId: 'i1', keyId: 'k1', privateKey: 'pk', teamId: 't1' };

      mockApiClient.claimJob.mockResolvedValueOnce({ build, credentials, devices: [] });

      await workerPrivate.poll();

      expect(mockApiClient.reportBuildComplete).toHaveBeenCalledWith(
        build.id,
        expect.any(Number),
        true
      );
    });

    it('reports build completion on failure', async () => {
      const build = createMockBuild();
      const credentials = { issuerId: 'i1', keyId: 'k1', privateKey: 'pk', teamId: 't1' };

      mockApiClient.claimJob.mockResolvedValueOnce({ build, credentials, devices: [] });
      mockExecuteBuild.mockRejectedValueOnce(new Error('Build failed'));

      await workerPrivate.poll();

      expect(mockApiClient.reportBuildComplete).toHaveBeenCalledWith(
        build.id,
        expect.any(Number),
        false
      );
    });

    it('updates status to failed on build error', async () => {
      const build = createMockBuild();
      const credentials = { issuerId: 'i1', keyId: 'k1', privateKey: 'pk', teamId: 't1' };

      mockApiClient.claimJob.mockResolvedValueOnce({ build, credentials, devices: [] });
      mockExecuteBuild.mockRejectedValueOnce(new Error('Build failed'));

      await workerPrivate.poll();

      expect(mockApiClient.updateStatus).toHaveBeenCalledWith(build.id, {
        status: 'failed',
        errorMessage: 'Build failed',
        errorCode: 'BUILD_ERROR',
      });
    });
  });

  describe('cleanup', () => {
    it('removes build directory contents', async () => {
      mockFs.readdir.mockResolvedValue(['build-123', 'build-456']);

      await workerPrivate.cleanup();

      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining('build-123'),
        { recursive: true, force: true }
      );
      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining('build-456'),
        { recursive: true, force: true }
      );
    });

    it('ignores cleanup errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Read error'));

      await expect(workerPrivate.cleanup()).resolves.not.toThrow();
    });
  });

  describe('sleep', () => {
    it('waits for specified duration', async () => {
      vi.useFakeTimers();

      const sleepPromise = workerPrivate.sleep(1000);

      await vi.advanceTimersByTimeAsync(1000);
      await sleepPromise;

      expect(true).toBe(true);
    });
  });
});
