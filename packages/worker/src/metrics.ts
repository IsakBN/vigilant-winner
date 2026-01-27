/**
 * System metrics for macOS worker heartbeats
 */

import { exec } from './exec.js';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  loadAverage: number;
}

/**
 * Get 1-minute load average from sysctl
 */
export async function getLoadAverage(): Promise<number> {
  const result = await exec('sysctl -n vm.loadavg');
  if (!result.success) return 0;

  const match = /\{\s*([\d.]+)/.exec(result.stdout);
  if (!match?.[1]) return 0;

  const value = parseFloat(match[1]);
  return isNaN(value) ? 0 : value;
}

/**
 * Get memory usage percentage from vm_stat
 */
export async function getMemoryUsage(): Promise<number> {
  const result = await exec('vm_stat');
  if (!result.success) return 0;

  const parsePages = (pattern: RegExp): number => {
    const match = result.stdout.match(pattern);
    return match?.[1] ? parseInt(match[1], 10) : 0;
  };

  const free = parsePages(/Pages free:\s+(\d+)/);
  const active = parsePages(/Pages active:\s+(\d+)/);
  const inactive = parsePages(/Pages inactive:\s+(\d+)/);
  const wired = parsePages(/Pages wired down:\s+(\d+)/);

  const total = free + active + inactive + wired;
  if (total === 0) return 0;

  const used = active + wired;
  return Math.round((used / total) * 100);
}

/**
 * Get disk usage percentage for root volume
 */
export async function getDiskUsage(): Promise<number> {
  const result = await exec('df -h / | tail -1');
  if (!result.success) return 0;

  const match = /(\d+)%/.exec(result.stdout);
  if (!match?.[1]) return 0;

  const value = parseInt(match[1], 10);
  return isNaN(value) ? 0 : value;
}

/**
 * Get CPU usage percentage from top
 */
export async function getCpuUsage(): Promise<number> {
  const result = await exec('top -l 1 -n 0 | head -10');
  if (!result.success) return 0;

  const match = /CPU usage:\s*([\d.]+)%\s*user,\s*([\d.]+)%\s*sys/.exec(
    result.stdout
  );
  if (!match?.[1] || !match?.[2]) return 0;

  const user = parseFloat(match[1]);
  const sys = parseFloat(match[2]);

  if (isNaN(user) || isNaN(sys)) return 0;
  return Math.round(user + sys);
}

/**
 * Collect all system metrics
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const [cpuUsage, memoryUsage, diskUsage, loadAverage] = await Promise.all([
    getCpuUsage(),
    getMemoryUsage(),
    getDiskUsage(),
    getLoadAverage(),
  ]);

  return { cpuUsage, memoryUsage, diskUsage, loadAverage };
}
