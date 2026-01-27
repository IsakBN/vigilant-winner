/**
 * Command execution utilities for build worker
 */

import { spawn } from 'child_process';
import type { ExecOptions, ExecResult, ExecSequenceResult } from './types.js';

/** Default timeout: 10 minutes */
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

/** Grace period before SIGKILL after SIGTERM */
const SIGKILL_DELAY_MS = 5000;

/**
 * Execute a shell command with timeout support
 */
export async function exec(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const { cwd, timeout = DEFAULT_TIMEOUT_MS, env } = options;

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killTimer: ReturnType<typeof setTimeout> | undefined;

    const proc = spawn('sh', ['-c', command], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
      killTimer = setTimeout(() => proc.kill('SIGKILL'), SIGKILL_DELAY_MS);
    }, timeout);

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code: number | null) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);

      resolve(buildResult(timedOut, code, stdout, stderr));
    });

    proc.on('error', (error: Error) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);

      resolve({
        success: false,
        stdout,
        stderr: error.message,
        exitCode: null,
      });
    });
  });
}

/**
 * Build the result object based on execution outcome
 */
function buildResult(
  timedOut: boolean,
  code: number | null,
  stdout: string,
  stderr: string
): ExecResult {
  if (timedOut) {
    return {
      success: false,
      stdout,
      stderr: stderr + '\n[Command timed out]',
      exitCode: null,
    };
  }

  return {
    success: code === 0,
    stdout,
    stderr,
    exitCode: code,
  };
}

/**
 * Execute multiple commands in sequence, stopping on first failure
 */
export async function execSequence(
  commands: string[],
  options: ExecOptions = {}
): Promise<ExecSequenceResult> {
  const results: ExecResult[] = [];

  for (const command of commands) {
    const result = await exec(command, options);
    results.push(result);

    if (!result.success) {
      return { success: false, results };
    }
  }

  return { success: true, results };
}
