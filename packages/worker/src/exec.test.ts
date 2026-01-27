/**
 * Tests for command execution utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import type { ChildProcess } from 'child_process';

// Mock child_process before importing exec
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

import { exec, execSequence } from './exec.js';
import { spawn } from 'child_process';

const mockSpawn = vi.mocked(spawn);

interface MockProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: ReturnType<typeof vi.fn>;
}

function createMockProcess(): MockProcess {
  const proc = new EventEmitter() as MockProcess;
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = vi.fn();
  return proc;
}

describe('exec', () => {
  let mockProcess: MockProcess;

  beforeEach(() => {
    vi.useFakeTimers();
    mockProcess = createMockProcess();
    mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should execute command successfully with exit code 0', async () => {
    const resultPromise = exec('echo hello');

    mockProcess.stdout.emit('data', Buffer.from('hello\n'));
    mockProcess.emit('close', 0);

    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.stdout).toBe('hello\n');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  });

  it('should handle failed execution with non-zero exit code', async () => {
    const resultPromise = exec('exit 1');

    mockProcess.stderr.emit('data', Buffer.from('error\n'));
    mockProcess.emit('close', 1);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.stderr).toBe('error\n');
    expect(result.exitCode).toBe(1);
  });

  it('should capture stdout correctly', async () => {
    const resultPromise = exec('echo test');

    mockProcess.stdout.emit('data', Buffer.from('line1\n'));
    mockProcess.stdout.emit('data', Buffer.from('line2\n'));
    mockProcess.emit('close', 0);

    const result = await resultPromise;

    expect(result.stdout).toBe('line1\nline2\n');
  });

  it('should capture stderr correctly', async () => {
    const resultPromise = exec('echo error >&2');

    mockProcess.stderr.emit('data', Buffer.from('error1\n'));
    mockProcess.stderr.emit('data', Buffer.from('error2\n'));
    mockProcess.emit('close', 0);

    const result = await resultPromise;

    expect(result.stderr).toBe('error1\nerror2\n');
  });

  it('should handle timeout with SIGTERM then SIGKILL', async () => {
    const resultPromise = exec('sleep 1000', { timeout: 1000 });

    // Fast-forward past timeout
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

    // Fast-forward past SIGKILL delay
    await vi.advanceTimersByTimeAsync(5000);
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');

    mockProcess.emit('close', null);
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.stderr).toContain('[Command timed out]');
    expect(result.exitCode).toBe(null);
  });

  it('should use custom timeout option', async () => {
    const customTimeout = 5000;
    const resultPromise = exec('long command', { timeout: customTimeout });

    // Should not timeout before custom timeout
    await vi.advanceTimersByTimeAsync(4999);
    expect(mockProcess.kill).not.toHaveBeenCalled();

    // Should timeout at custom timeout
    await vi.advanceTimersByTimeAsync(1);
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

    mockProcess.emit('close', null);
    await resultPromise;
  });

  it('should use cwd option', () => {
    void exec('ls', { cwd: '/tmp' });

    expect(mockSpawn).toHaveBeenCalledWith(
      'sh',
      ['-c', 'ls'],
      expect.objectContaining({ cwd: '/tmp' })
    );
  });

  it('should handle process error', async () => {
    const resultPromise = exec('invalid');

    mockProcess.emit('error', new Error('spawn failed'));

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.stderr).toBe('spawn failed');
    expect(result.exitCode).toBe(null);
  });
});

describe('execSequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute all commands when all succeed', async () => {
    const commands = ['cmd1', 'cmd2', 'cmd3'];
    let callCount = 0;

    mockSpawn.mockImplementation(() => {
      const proc = createMockProcess();
      callCount++;
      // Emit close event on next tick
      setImmediate(() => proc.emit('close', 0));
      return proc as unknown as ChildProcess;
    });

    const result = await execSequence(commands);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results.every((r) => r.success)).toBe(true);
    expect(callCount).toBe(3);
  });

  it('should stop on first failure', async () => {
    const commands = ['cmd1', 'cmd2', 'cmd3'];
    let callCount = 0;

    mockSpawn.mockImplementation(() => {
      const proc = createMockProcess();
      callCount++;
      const currentCall = callCount;
      const exitCode = currentCall === 2 ? 1 : 0;
      setImmediate(() => {
        if (currentCall === 1) {
          proc.stdout.emit('data', Buffer.from('ok\n'));
        } else if (currentCall === 2) {
          proc.stderr.emit('data', Buffer.from('failed\n'));
        }
        proc.emit('close', exitCode);
      });
      return proc as unknown as ChildProcess;
    });

    const result = await execSequence(commands);

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.success).toBe(true);
    expect(result.results[1]?.success).toBe(false);
    expect(callCount).toBe(2);
  });

  it('should return empty results for empty commands', async () => {
    const result = await execSequence([]);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it('should pass options to each command', async () => {
    mockSpawn.mockImplementation(() => {
      const proc = createMockProcess();
      setImmediate(() => proc.emit('close', 0));
      return proc as unknown as ChildProcess;
    });

    const options = { cwd: '/tmp', timeout: 5000 };
    await execSequence(['cmd1'], options);

    expect(mockSpawn).toHaveBeenCalledWith(
      'sh',
      ['-c', 'cmd1'],
      expect.objectContaining({ cwd: '/tmp' })
    );
  });
});
