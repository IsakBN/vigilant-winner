/**
 * App Store Connect API module for device registration and provisioning profiles.
 */

import crypto from 'node:crypto';
import type { BuildCredentials } from './types.js';

const APPSTORE_API_BASE = 'https://api.appstoreconnect.apple.com/v1';
const JWT_EXPIRY_SECONDS = 20 * 60; // 20 minutes

export type ProfileType = 'IOS_APP_DEVELOPMENT' | 'IOS_APP_ADHOC' | 'IOS_APP_STORE';

export interface ProvisioningConfig {
  name: string;
  bundleIdId: string;
  certificateIds: string[];
  deviceIds: string[];
  profileType: ProfileType;
}

/** Base64URL encode data (URL-safe base64 without padding) */
export function base64url(data: string | Buffer): string {
  const str = Buffer.isBuffer(data)
    ? data.toString('base64')
    : Buffer.from(data).toString('base64');
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Generate JWT for App Store Connect API authentication */
export function generateJWT(credentials: BuildCredentials): string {
  const header = { alg: 'ES256', kid: credentials.keyId, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.issuerId,
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
    aud: 'appstoreconnect-v1',
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const privateKey = crypto.createPrivateKey({ key: credentials.privateKey, format: 'pem' });
  const signature = crypto.sign('sha256', Buffer.from(signingInput), privateKey);

  return `${signingInput}.${base64url(signature)}`;
}

/** Register a device with Apple via App Store Connect API */
export async function registerDevice(
  jwt: string,
  udid: string,
  name: string
): Promise<{ id: string } | null> {
  const response = await fetch(`${APPSTORE_API_BASE}/devices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'devices',
        attributes: { name, platform: 'IOS', udid },
      },
    }),
  });

  if (!response.ok) {
    console.warn(`Failed to register device ${udid}:`, await response.text());
    return null;
  }

  const data = (await response.json()) as { data: { id: string } };
  return { id: data.data.id };
}

/** Create a provisioning profile via App Store Connect API */
export async function createProvisioningProfile(
  jwt: string,
  config: ProvisioningConfig
): Promise<{ id: string; profileContent: string } | null> {
  const response = await fetch(`${APPSTORE_API_BASE}/profiles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'profiles',
        attributes: { name: config.name, profileType: config.profileType },
        relationships: {
          bundleId: { data: { type: 'bundleIds', id: config.bundleIdId } },
          certificates: {
            data: config.certificateIds.map((id) => ({ type: 'certificates', id })),
          },
          devices: {
            data: config.deviceIds.map((id) => ({ type: 'devices', id })),
          },
        },
      },
    }),
  });

  if (!response.ok) {
    console.warn('Failed to create profile:', await response.text());
    return null;
  }

  const data = (await response.json()) as {
    data: { id: string; attributes: { profileContent: string } };
  };

  return { id: data.data.id, profileContent: data.data.attributes.profileContent };
}
