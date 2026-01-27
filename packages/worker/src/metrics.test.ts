/**
 * Tests for system metrics collection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./exec.js', () => ({ exec: vi.fn() }));

import { exec } from './exec.js';
import {
  getLoadAverage,
  getMemoryUsage,
  getDiskUsage,
  getCpuUsage,
  getSystemMetrics,
} from './metrics.js';
import type { ExecResult } from './types.js';

const mockExec = vi.mocked(exec);

const success = (stdout: string): ExecResult => ({
  success: true, stdout, stderr: '', exitCode: 0,
});

const failure = (): ExecResult => ({
  success: false, stdout: '', stderr: 'error', exitCode: 1,
});

describe('getLoadAverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should parse load average from sysctl output', async () => {
    mockExec.mockResolvedValue(success('{ 1.45 1.67 1.89 }'));
    expect(await getLoadAverage()).toBe(1.45);
    expect(mockExec).toHaveBeenCalledWith('sysctl -n vm.loadavg');
  });

  it('should return 0 when command fails', async () => {
    mockExec.mockResolvedValue(failure());
    expect(await getLoadAverage()).toBe(0);
  });

  it('should return 0 for malformed output', async () => {
    mockExec.mockResolvedValue(success('invalid output'));
    expect(await getLoadAverage()).toBe(0);
  });

  it('should return 0 for empty output', async () => {
    mockExec.mockResolvedValue(success(''));
    expect(await getLoadAverage()).toBe(0);
  });
});

describe('getMemoryUsage', () => {
  beforeEach(() => vi.clearAllMocks());

  const vmStatOutput = `Mach Virtual Memory Statistics:
Pages free:          100000.
Pages active:        200000.
Pages inactive:      50000.
Pages wired down:    150000.`;

  it('should calculate memory usage from vm_stat output', async () => {
    mockExec.mockResolvedValue(success(vmStatOutput));
    // used = 200000 + 150000 = 350000, total = 500000, usage = 70%
    expect(await getMemoryUsage()).toBe(70);
    expect(mockExec).toHaveBeenCalledWith('vm_stat');
  });

  it('should return 0 when command fails', async () => {
    mockExec.mockResolvedValue(failure());
    expect(await getMemoryUsage()).toBe(0);
  });

  it('should return 0 for malformed output', async () => {
    mockExec.mockResolvedValue(success('invalid memory stats'));
    expect(await getMemoryUsage()).toBe(0);
  });

  it('should return 0 when all values are zero', async () => {
    const zeroStats = `Pages free: 0.\nPages active: 0.\nPages inactive: 0.\nPages wired down: 0.`;
    mockExec.mockResolvedValue(success(zeroStats));
    expect(await getMemoryUsage()).toBe(0);
  });
});

describe('getDiskUsage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should parse disk usage percentage from df output', async () => {
    mockExec.mockResolvedValue(success('/dev/disk1s1  466Gi  234Gi  232Gi    51%   /'));
    expect(await getDiskUsage()).toBe(51);
    expect(mockExec).toHaveBeenCalledWith('df -h / | tail -1');
  });

  it('should return 0 when command fails', async () => {
    mockExec.mockResolvedValue(failure());
    expect(await getDiskUsage()).toBe(0);
  });

  it('should return 0 for malformed output', async () => {
    mockExec.mockResolvedValue(success('invalid disk output'));
    expect(await getDiskUsage()).toBe(0);
  });

  it('should handle different df output formats', async () => {
    mockExec.mockResolvedValue(success('/dev/disk3s1  1.8Ti  1.2Ti  597Gi    68%  100%   /'));
    expect(await getDiskUsage()).toBe(68);
  });
});

describe('getCpuUsage', () => {
  beforeEach(() => vi.clearAllMocks());

  const topOutput = `Processes: 386 total, 2 running
Load Avg: 1.45, 1.67, 1.89
CPU usage: 12.34% user, 5.67% sys, 81.99% idle`;

  it('should calculate CPU usage from top output', async () => {
    mockExec.mockResolvedValue(success(topOutput));
    expect(await getCpuUsage()).toBe(18); // 12.34 + 5.67 rounded
    expect(mockExec).toHaveBeenCalledWith('top -l 1 -n 0 | head -10');
  });

  it('should return 0 when command fails', async () => {
    mockExec.mockResolvedValue(failure());
    expect(await getCpuUsage()).toBe(0);
  });

  it('should return 0 for malformed output', async () => {
    mockExec.mockResolvedValue(success('no cpu info here'));
    expect(await getCpuUsage()).toBe(0);
  });

  it('should handle high CPU usage values', async () => {
    mockExec.mockResolvedValue(success('CPU usage: 85.50% user, 12.30% sys, 2.20% idle'));
    expect(await getCpuUsage()).toBe(98);
  });
});

describe('getSystemMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return all four metrics', async () => {
    mockExec
      .mockResolvedValueOnce(success('CPU usage: 25.00% user, 10.00% sys, 65.00% idle'))
      .mockResolvedValueOnce(success(`Pages free: 100000.\nPages active: 300000.
Pages inactive: 100000.\nPages wired down: 100000.`))
      .mockResolvedValueOnce(success('/dev/disk1s1  466Gi  234Gi  232Gi    45%   /'))
      .mockResolvedValueOnce(success('{ 2.50 2.00 1.50 }'));

    const result = await getSystemMetrics();
    expect(result.cpuUsage).toBe(35);
    expect(result.memoryUsage).toBe(67);
    expect(result.diskUsage).toBe(45);
    expect(result.loadAverage).toBe(2.5);
  });

  it('should return zeros when all commands fail', async () => {
    mockExec.mockResolvedValue(failure());
    const result = await getSystemMetrics();
    expect(result).toEqual({ cpuUsage: 0, memoryUsage: 0, diskUsage: 0, loadAverage: 0 });
  });

  it('should handle partial failures gracefully', async () => {
    mockExec
      .mockResolvedValueOnce(success('CPU usage: 50.00% user, 10.00% sys, 40.00% idle'))
      .mockResolvedValueOnce(failure())
      .mockResolvedValueOnce(success('/dev/disk1s1  466Gi  234Gi  232Gi    75%   /'))
      .mockResolvedValueOnce(failure());

    const result = await getSystemMetrics();
    expect(result).toEqual({ cpuUsage: 60, memoryUsage: 0, diskUsage: 75, loadAverage: 0 });
  });
});
