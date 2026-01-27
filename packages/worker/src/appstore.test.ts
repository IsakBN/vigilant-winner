import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import {
  generateJWT,
  registerDevice,
  createProvisioningProfile,
  base64url,
} from './appstore.js';
import type { BuildCredentials } from './types.js';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('node:crypto', () => ({
  default: {
    createPrivateKey: vi.fn(),
    sign: vi.fn(),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// =============================================================================
// Test Data
// =============================================================================

const mockCredentials: BuildCredentials = {
  issuerId: 'test-issuer-id',
  keyId: 'test-key-id',
  privateKey: '-----BEGIN EC PRIVATE KEY-----\ntest\n-----END EC PRIVATE KEY-----',
  teamId: 'TEAM123',
};

const mockPrivateKeyObject = { asymmetricKeyType: 'ec' };

// =============================================================================
// Tests: base64url
// =============================================================================

describe('base64url', () => {
  it('encodes string to base64url', () => {
    const result = base64url('hello');
    expect(result).toBe('aGVsbG8');
  });

  it('encodes Buffer to base64url', () => {
    const result = base64url(Buffer.from('hello'));
    expect(result).toBe('aGVsbG8');
  });

  it('removes padding characters', () => {
    // "a" encodes to "YQ==" in standard base64
    const result = base64url('a');
    expect(result).not.toContain('=');
    expect(result).toBe('YQ');
  });

  it('replaces + with -', () => {
    // Create a string that would produce + in base64
    const result = base64url(Buffer.from([251, 239])); // produces "++" in standard base64
    expect(result).not.toContain('+');
  });

  it('replaces / with _', () => {
    // Create a string that would produce / in base64
    const result = base64url(Buffer.from([255, 255])); // produces "//" in standard base64
    expect(result).not.toContain('/');
  });
});

// =============================================================================
// Tests: generateJWT
// =============================================================================

describe('generateJWT', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    vi.mocked(crypto.createPrivateKey).mockReturnValue(mockPrivateKeyObject as never);
    vi.mocked(crypto.sign).mockReturnValue(Buffer.from('mock-signature') as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('creates correct header structure', () => {
    generateJWT(mockCredentials);

    const signCalls = vi.mocked(crypto.sign).mock.calls;
    const signCall = signCalls[0];
    if (!signCall) {
      throw new Error('Expected sign to be called');
    }
    const signingInputBuffer = signCall[1] as Buffer;
    const signingInput = signingInputBuffer.toString();
    const headerB64 = signingInput.split('.')[0];
    if (!headerB64) {
      throw new Error('Expected header to exist');
    }
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString()) as Record<string, unknown>;

    expect(header).toEqual({
      alg: 'ES256',
      kid: 'test-key-id',
      typ: 'JWT',
    });
  });

  it('creates correct payload with timestamps', () => {
    generateJWT(mockCredentials);

    const signCalls = vi.mocked(crypto.sign).mock.calls;
    const signCall = signCalls[0];
    if (!signCall) {
      throw new Error('Expected sign to be called');
    }
    const signingInputBuffer = signCall[1] as Buffer;
    const signingInput = signingInputBuffer.toString();
    const payloadB64 = signingInput.split('.')[1];
    if (!payloadB64) {
      throw new Error('Expected payload to exist');
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString()) as Record<string, unknown>;

    const expectedIat = Math.floor(new Date('2024-01-15T12:00:00Z').getTime() / 1000);
    expect(payload).toEqual({
      iss: 'test-issuer-id',
      iat: expectedIat,
      exp: expectedIat + 20 * 60,
      aud: 'appstoreconnect-v1',
    });
  });

  it('signs with ES256 algorithm', () => {
    generateJWT(mockCredentials);

    expect(crypto.createPrivateKey).toHaveBeenCalledWith({
      key: mockCredentials.privateKey,
      format: 'pem',
    });
    expect(crypto.sign).toHaveBeenCalledWith(
      'sha256',
      expect.any(Buffer),
      mockPrivateKeyObject
    );
  });

  it('returns properly formatted token', () => {
    const token = generateJWT(mockCredentials);
    const parts = token.split('.');

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBeTruthy();
    expect(parts[1]).toBeTruthy();
    expect(parts[2]).toBeTruthy();
  });
});

// =============================================================================
// Tests: registerDevice
// =============================================================================

describe('registerDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls correct endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'device-123' } }),
    });

    await registerDevice('test-jwt', 'test-udid', 'Test Device');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.appstoreconnect.apple.com/v1/devices',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'devices',
            attributes: {
              name: 'Test Device',
              platform: 'IOS',
              udid: 'test-udid',
            },
          },
        }),
      }
    );
  });

  it('returns id on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'device-123' } }),
    });

    const result = await registerDevice('test-jwt', 'test-udid', 'Test Device');

    expect(result).toEqual({ id: 'device-123' });
  });

  it('returns null on failure', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Device already exists'),
    });

    const result = await registerDevice('test-jwt', 'test-udid', 'Test Device');

    expect(result).toBeNull();
    expect(consoleWarn).toHaveBeenCalledWith(
      'Failed to register device test-udid:',
      'Device already exists'
    );
    consoleWarn.mockRestore();
  });
});

// =============================================================================
// Tests: createProvisioningProfile
// =============================================================================

describe('createProvisioningProfile', () => {
  const mockConfig = {
    name: 'Test Profile',
    bundleIdId: 'bundle-123',
    certificateIds: ['cert-1', 'cert-2'],
    deviceIds: ['device-1', 'device-2'],
    profileType: 'IOS_APP_ADHOC' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls correct endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            id: 'profile-123',
            attributes: { profileContent: 'base64-content' },
          },
        }),
    });

    await createProvisioningProfile('test-jwt', mockConfig);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.appstoreconnect.apple.com/v1/profiles',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'profiles',
            attributes: {
              name: 'Test Profile',
              profileType: 'IOS_APP_ADHOC',
            },
            relationships: {
              bundleId: {
                data: { type: 'bundleIds', id: 'bundle-123' },
              },
              certificates: {
                data: [
                  { type: 'certificates', id: 'cert-1' },
                  { type: 'certificates', id: 'cert-2' },
                ],
              },
              devices: {
                data: [
                  { type: 'devices', id: 'device-1' },
                  { type: 'devices', id: 'device-2' },
                ],
              },
            },
          },
        }),
      }
    );
  });

  it('returns profile data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            id: 'profile-123',
            attributes: { profileContent: 'base64-profile-content' },
          },
        }),
    });

    const result = await createProvisioningProfile('test-jwt', mockConfig);

    expect(result).toEqual({
      id: 'profile-123',
      profileContent: 'base64-profile-content',
    });
  });

  it('returns null on failure', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Invalid certificate'),
    });

    const result = await createProvisioningProfile('test-jwt', mockConfig);

    expect(result).toBeNull();
    expect(consoleWarn).toHaveBeenCalledWith(
      'Failed to create profile:',
      'Invalid certificate'
    );
    consoleWarn.mockRestore();
  });
});
