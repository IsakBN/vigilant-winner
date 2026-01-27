/**
 * Test Data Generators
 *
 * Provides randomized test data for load testing scenarios.
 * Generates realistic device IDs, app versions, and device info.
 */

import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// =============================================================================
// Constants
// =============================================================================

/** Test app ID - set via environment variable */
export const TEST_APP_ID = __ENV.APP_ID || '00000000-0000-0000-0000-000000000001';

/** API base URL */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';

/** Platforms with distribution */
const PLATFORMS = ['ios', 'android'];
const PLATFORM_WEIGHTS = [0.55, 0.45]; // 55% iOS, 45% Android

/** iOS versions with realistic distribution */
const IOS_VERSIONS = [
  { version: '17.4', weight: 0.35 },
  { version: '17.3', weight: 0.25 },
  { version: '17.2', weight: 0.15 },
  { version: '16.7', weight: 0.10 },
  { version: '16.6', weight: 0.08 },
  { version: '15.8', weight: 0.05 },
  { version: '15.0', weight: 0.02 },
];

/** Android versions with realistic distribution */
const ANDROID_VERSIONS = [
  { version: '14', weight: 0.30 },
  { version: '13', weight: 0.35 },
  { version: '12', weight: 0.20 },
  { version: '11', weight: 0.10 },
  { version: '10', weight: 0.05 },
];

/** iOS device models */
const IOS_DEVICES = [
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 12',
  'iPhone SE',
];

/** Android device models */
const ANDROID_DEVICES = [
  'Pixel 8 Pro',
  'Pixel 8',
  'Pixel 7',
  'Samsung Galaxy S24',
  'Samsung Galaxy S23',
  'Samsung Galaxy S22',
  'Samsung Galaxy A54',
  'OnePlus 12',
  'OnePlus 11',
  'Xiaomi 14',
];

/** Timezones with distribution */
const TIMEZONES = [
  { tz: 'America/New_York', weight: 0.25 },
  { tz: 'America/Los_Angeles', weight: 0.20 },
  { tz: 'America/Chicago', weight: 0.15 },
  { tz: 'Europe/London', weight: 0.10 },
  { tz: 'Europe/Paris', weight: 0.08 },
  { tz: 'Asia/Tokyo', weight: 0.07 },
  { tz: 'Asia/Shanghai', weight: 0.05 },
  { tz: 'Australia/Sydney', weight: 0.05 },
  { tz: 'America/Sao_Paulo', weight: 0.03 },
  { tz: 'Asia/Mumbai', weight: 0.02 },
];

/** Locales with distribution */
const LOCALES = [
  { locale: 'en-US', weight: 0.40 },
  { locale: 'en-GB', weight: 0.10 },
  { locale: 'es-ES', weight: 0.10 },
  { locale: 'fr-FR', weight: 0.08 },
  { locale: 'de-DE', weight: 0.07 },
  { locale: 'pt-BR', weight: 0.06 },
  { locale: 'ja-JP', weight: 0.05 },
  { locale: 'zh-CN', weight: 0.05 },
  { locale: 'ko-KR', weight: 0.04 },
  { locale: 'it-IT', weight: 0.05 },
];

/** App versions - newer versions have higher weight */
const APP_VERSIONS = [
  { version: '2.5.0', weight: 0.40 },
  { version: '2.4.0', weight: 0.25 },
  { version: '2.3.0', weight: 0.15 },
  { version: '2.2.0', weight: 0.10 },
  { version: '2.1.0', weight: 0.07 },
  { version: '2.0.0', weight: 0.03 },
];

/** Bundle versions - simulates devices on different OTA versions */
const BUNDLE_VERSIONS = [
  { version: '1.0.5', weight: 0.30 },
  { version: '1.0.4', weight: 0.25 },
  { version: '1.0.3', weight: 0.20 },
  { version: '1.0.2', weight: 0.10 },
  { version: '1.0.1', weight: 0.10 },
  { version: null, weight: 0.05 }, // No OTA bundle yet
];

/** Channels with distribution */
const CHANNELS = [
  { channel: 'production', weight: 0.80 },
  { channel: 'staging', weight: 0.10 },
  { channel: 'beta', weight: 0.07 },
  { channel: 'alpha', weight: 0.03 },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Select item from weighted list
 */
function weightedRandom(items) {
  const rand = Math.random();
  let cumulative = 0;

  for (const item of items) {
    cumulative += item.weight;
    if (rand < cumulative) {
      return item;
    }
  }

  return items[items.length - 1];
}

/**
 * Generate random hex string
 */
function randomHex(length) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate UUID v4
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =============================================================================
// Data Generators
// =============================================================================

/**
 * Generate a random device ID
 * iOS uses IDFV format, Android uses Android ID format
 */
export function generateDeviceId(platform) {
  if (platform === 'ios') {
    // iOS IDFV format: UUID
    return generateUUID().toUpperCase();
  }
  // Android ID format: 16 char hex
  return randomHex(16);
}

/**
 * Generate a random platform based on realistic distribution
 */
export function generatePlatform() {
  const rand = Math.random();
  return rand < PLATFORM_WEIGHTS[0] ? 'ios' : 'android';
}

/**
 * Generate OS version for platform
 */
export function generateOsVersion(platform) {
  const versions = platform === 'ios' ? IOS_VERSIONS : ANDROID_VERSIONS;
  return weightedRandom(versions).version;
}

/**
 * Generate device model for platform
 */
export function generateDeviceModel(platform) {
  const devices = platform === 'ios' ? IOS_DEVICES : ANDROID_DEVICES;
  return randomItem(devices);
}

/**
 * Generate timezone
 */
export function generateTimezone() {
  return weightedRandom(TIMEZONES).tz;
}

/**
 * Generate locale
 */
export function generateLocale() {
  return weightedRandom(LOCALES).locale;
}

/**
 * Generate app version
 */
export function generateAppVersion() {
  return weightedRandom(APP_VERSIONS).version;
}

/**
 * Generate current bundle version (can be null for fresh installs)
 */
export function generateBundleVersion() {
  return weightedRandom(BUNDLE_VERSIONS).version;
}

/**
 * Generate channel
 */
export function generateChannel() {
  return weightedRandom(CHANNELS).channel;
}

/**
 * Generate a complete device profile
 */
export function generateDevice() {
  const platform = generatePlatform();
  const deviceId = generateDeviceId(platform);

  return {
    deviceId,
    platform,
    appVersion: generateAppVersion(),
    currentBundleVersion: generateBundleVersion(),
    channel: generateChannel(),
    deviceInfo: {
      osVersion: generateOsVersion(platform),
      deviceModel: generateDeviceModel(platform),
      timezone: generateTimezone(),
      locale: generateLocale(),
    },
  };
}

/**
 * Generate a batch of devices for pre-registration
 */
export function generateDeviceBatch(count) {
  const devices = [];
  for (let i = 0; i < count; i++) {
    devices.push(generateDevice());
  }
  return devices;
}
