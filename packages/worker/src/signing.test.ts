/**
 * Tests for Apple Code Signing utilities
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exec } from './exec.js';
import {
  cleanupSigning,
  generateExportOptions,
  setupSigning,
} from './signing.js';
import type { BuildCredentials, SigningConfig, SigningInfo } from './types.js';

// Mock dependencies
vi.mock('./exec.js', () => ({
  exec: vi.fn(),
}));

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof crypto>('crypto');
  return {
    ...actual,
    randomBytes: vi.fn(),
  };
});

vi.mock('fs/promises', () => ({
  unlink: vi.fn(),
}));

const mockExec = vi.mocked(exec);
const mockRandomBytes = vi.mocked(crypto.randomBytes);
const mockUnlink = vi.mocked(fs.unlink);

describe('signing', () => {
  const mockCredentials: BuildCredentials = {
    issuerId: 'issuer-123',
    keyId: 'key-456',
    privateKey: 'mock-private-key',
    teamId: 'TEAM123',
  };

  const mockConfig: SigningConfig = {
    credentials: mockCredentials,
    devices: [{ udid: 'device-1', name: 'iPhone Test' }],
    buildDir: '/tmp/build',
    bundleId: 'com.example.app',
    exportMethod: 'ad-hoc',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomBytes.mockReturnValue(Buffer.from('0123456789abcdef') as never);
    mockExec.mockResolvedValue({
      success: true,
      stdout: '"/path/to/keychain"',
      stderr: '',
      exitCode: 0,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('setupSigning', () => {
    it('creates keychain with correct commands', async () => {
      await setupSigning(mockConfig);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('security create-keychain')
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('security set-keychain-settings -lut 21600')
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('security unlock-keychain')
      );
      expect(mockExec).toHaveBeenCalledWith(
        'security list-keychains -d user'
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('security list-keychains -d user -s')
      );
    });

    it('generates correct buildSettings', async () => {
      const result = await setupSigning(mockConfig);

      expect(result.buildSettings).toBe(
        'DEVELOPMENT_TEAM=TEAM123 PRODUCT_BUNDLE_IDENTIFIER=com.example.app'
      );
    });

    it('generates correct SigningInfo', async () => {
      const result = await setupSigning(mockConfig);

      expect(result.keychainPath).toBe('/tmp/build/build.keychain-db');
      expect(result.keychainPassword).toBe('30313233343536373839616263646566');
      expect(result.profilePath).toBe('/tmp/build/build.mobileprovision');
      expect(result.certificatePath).toBe('/tmp/build/certificate.p12');
      expect(result.teamId).toBe('TEAM123');
      expect(result.exportOptionsPlist).toContain('ad-hoc');
    });
  });

  describe('cleanupSigning', () => {
    const mockSigningInfo: SigningInfo = {
      keychainPath: '/tmp/build/build.keychain-db',
      keychainPassword: 'password123',
      profilePath: '/tmp/build/build.mobileprovision',
      certificatePath: '/tmp/build/certificate.p12',
      teamId: 'TEAM123',
      buildSettings: 'DEVELOPMENT_TEAM=TEAM123',
      exportOptionsPlist: '<plist></plist>',
    };

    it('deletes keychain', async () => {
      mockUnlink.mockResolvedValue(undefined);

      await cleanupSigning(mockSigningInfo);

      expect(mockExec).toHaveBeenCalledWith(
        'security delete-keychain "/tmp/build/build.keychain-db"'
      );
    });

    it('ignores file deletion errors', async () => {
      mockUnlink.mockRejectedValue(new Error('File not found'));

      // Should not throw
      await expect(cleanupSigning(mockSigningInfo)).resolves.not.toThrow();
    });

    it('continues cleanup if keychain deletion fails', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
      mockExec.mockRejectedValueOnce(new Error('Keychain not found'));
      mockUnlink.mockResolvedValue(undefined);

      await cleanupSigning(mockSigningInfo);

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to delete keychain:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });

  describe('generateExportOptions', () => {
    it('generates correct plist for ad-hoc method', () => {
      const result = generateExportOptions({
        teamId: 'TEAM123',
        bundleId: 'com.example.app',
        exportMethod: 'ad-hoc',
      });

      expect(result).toContain('<string>ad-hoc</string>');
      expect(result).toContain('<string>TEAM123</string>');
      expect(result).toContain('<string>manual</string>');
      expect(result).toContain('<key>stripSwiftSymbols</key>');
      expect(result).toContain('<true/>');
    });

    it('generates correct plist for development method', () => {
      const result = generateExportOptions({
        teamId: 'TEAM456',
        bundleId: 'com.example.dev',
        exportMethod: 'development',
      });

      expect(result).toContain('<string>development</string>');
      expect(result).toContain('<string>TEAM456</string>');
      expect(result).toContain('<string>manual</string>');
    });

    it('generates correct plist for app-store method', () => {
      const result = generateExportOptions({
        teamId: 'TEAM789',
        bundleId: 'com.example.store',
        exportMethod: 'app-store',
      });

      expect(result).toContain('<string>app-store</string>');
      expect(result).toContain('<string>TEAM789</string>');
      expect(result).toContain('<string>automatic</string>');
    });

    it('generates correct plist for enterprise method', () => {
      const result = generateExportOptions({
        teamId: 'ENTERPRISE1',
        bundleId: 'com.enterprise.app',
        exportMethod: 'enterprise',
      });

      expect(result).toContain('<string>enterprise</string>');
      expect(result).toContain('<string>ENTERPRISE1</string>');
      expect(result).toContain('<string>manual</string>');
    });

    it('includes required plist keys', () => {
      const result = generateExportOptions({
        teamId: 'TEST',
        bundleId: 'com.test',
        exportMethod: 'ad-hoc',
      });

      expect(result).toContain('<key>method</key>');
      expect(result).toContain('<key>teamID</key>');
      expect(result).toContain('<key>signingStyle</key>');
      expect(result).toContain('<key>stripSwiftSymbols</key>');
      expect(result).toContain('<key>uploadSymbols</key>');
      expect(result).toContain('<key>compileBitcode</key>');
      expect(result).toContain('<false/>');
    });
  });
});
