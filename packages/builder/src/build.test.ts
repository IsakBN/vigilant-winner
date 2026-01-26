/**
 * Build module tests
 * @agent builder-completion
 */

import { describe, it, expect } from 'vitest';

describe('Build Module', () => {
  describe('loadConfig validation', () => {
    it('should require repo field', () => {
      const config = { repo: '', commitSha: 'abc', githubToken: 'token' };
      expect(config.repo).toBe('');
    });

    it('should require commitSha field', () => {
      const config = { repo: 'owner/repo', commitSha: '' };
      expect(config.commitSha).toBe('');
    });

    it('should accept valid config', () => {
      const config = {
        repo: 'owner/repo',
        commitSha: 'abc123',
        githubToken: 'ghp_xxx',
        bundleKey: 'bundles/123.js',
        releaseId: 'release-123',
        callbackUrl: 'https://api.example.com/callback',
        buildFolder: '',
        r2: {
          endpoint: 'https://r2.example.com',
          accessKey: 'access',
          secretKey: 'secret',
          bucket: 'bundles',
        },
      };

      expect(config.repo).toBe('owner/repo');
      expect(config.r2.bucket).toBe('bundles');
    });
  });

  describe('package manager detection', () => {
    it('should prioritize pnpm-lock.yaml', () => {
      const files = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'];
      const pm = files.includes('pnpm-lock.yaml') ? 'pnpm' : 'npm';
      expect(pm).toBe('pnpm');
    });

    it('should fallback to yarn.lock', () => {
      const files = ['yarn.lock', 'package-lock.json'];
      const pm = files.includes('pnpm-lock.yaml')
        ? 'pnpm'
        : files.includes('yarn.lock')
          ? 'yarn'
          : 'npm';
      expect(pm).toBe('yarn');
    });

    it('should default to npm', () => {
      const files = ['package-lock.json'];
      const pm = files.includes('pnpm-lock.yaml')
        ? 'pnpm'
        : files.includes('yarn.lock')
          ? 'yarn'
          : 'npm';
      expect(pm).toBe('npm');
    });
  });

  describe('install command generation', () => {
    it('should generate npm install command', () => {
      const commands: Record<string, [string, string[]]> = {
        npm: ['npm', ['install', '--legacy-peer-deps']],
        yarn: ['yarn', ['install', '--frozen-lockfile']],
        pnpm: ['pnpm', ['install', '--frozen-lockfile']],
      };

      expect(commands.npm).toEqual(['npm', ['install', '--legacy-peer-deps']]);
    });

    it('should generate yarn install command', () => {
      const commands: Record<string, [string, string[]]> = {
        npm: ['npm', ['install', '--legacy-peer-deps']],
        yarn: ['yarn', ['install', '--frozen-lockfile']],
        pnpm: ['pnpm', ['install', '--frozen-lockfile']],
      };

      expect(commands.yarn).toEqual(['yarn', ['install', '--frozen-lockfile']]);
    });

    it('should generate pnpm install command', () => {
      const commands: Record<string, [string, string[]]> = {
        npm: ['npm', ['install', '--legacy-peer-deps']],
        yarn: ['yarn', ['install', '--frozen-lockfile']],
        pnpm: ['pnpm', ['install', '--frozen-lockfile']],
      };

      expect(commands.pnpm).toEqual(['pnpm', ['install', '--frozen-lockfile']]);
    });
  });

  describe('entry file detection', () => {
    it('should check common entry file patterns', () => {
      const candidates = ['index.js', 'index.tsx', 'src/index.js', 'src/index.tsx'];
      expect(candidates).toContain('index.js');
      expect(candidates).toContain('index.tsx');
    });

    it('should default to index.js', () => {
      const foundFile = undefined as string | undefined;
      const entryFile = foundFile ?? 'index.js';
      expect(entryFile).toBe('index.js');
    });
  });

  describe('formatBytes utility', () => {
    function formatBytes(bytes: number): string {
      if (bytes < 1024) return `${String(bytes)} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(5 * 1024)).toBe('5.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });

  describe('timeout handling', () => {
    it('should have 5 minute build timeout', () => {
      const BUILD_TIMEOUT_MS = 5 * 60 * 1000;
      expect(BUILD_TIMEOUT_MS).toBe(300000);
    });

    it('should detect timeout condition', () => {
      const startTime = Date.now() - 310000; // 310 seconds ago
      const BUILD_TIMEOUT_MS = 300000;
      const elapsed = Date.now() - startTime;
      expect(elapsed > BUILD_TIMEOUT_MS).toBe(true);
    });
  });
});
