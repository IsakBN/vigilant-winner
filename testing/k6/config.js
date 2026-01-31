/**
 * k6 Load Test Configuration
 *
 * Shared configuration for all k6 load tests.
 * Base URL is configurable via K6_BASE_URL environment variable.
 *
 * @modified 2026-01-31
 */

// Base URL for API - configurable via environment
export const BASE_URL = __ENV.K6_BASE_URL || 'https://api.bundlenudge.com';

// API key for authenticated endpoints (set via K6_API_KEY env var)
export const API_KEY = __ENV.K6_API_KEY || '';

// Test app configuration (set via environment or use defaults for testing)
export const TEST_APP_ID = __ENV.K6_TEST_APP_ID || 'test-app-load';
export const TEST_RELEASE_ID = __ENV.K6_TEST_RELEASE_ID || 'test-release-load';

// =============================================================================
// Thresholds
// =============================================================================

export const THRESHOLDS = {
  // Response time thresholds
  http_req_duration: [
    'p(95)<200',  // 95% of requests must complete under 200ms
    'p(99)<500',  // 99% of requests must complete under 500ms
  ],
  // Error rate threshold (less than 0.001% = 1 in 100,000)
  http_req_failed: ['rate<0.00001'],
  // Checks must pass 99.99% of the time
  checks: ['rate>0.9999'],
};

// =============================================================================
// Test Scenarios
// =============================================================================

export const SCENARIOS = {
  // Smoke test - Quick validation that system is working
  smoke: {
    executor: 'constant-vus',
    vus: 10,
    duration: '1m',
  },

  // Load test - Normal expected load with ramp up/down
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },   // Ramp up to 50 VUs
      { duration: '3m', target: 100 },  // Stay at 100 VUs
      { duration: '1m', target: 0 },    // Ramp down to 0
    ],
    gracefulRampDown: '30s',
  },

  // Stress test - Push the system to its limits
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 100 },  // Ramp up quickly
      { duration: '1m', target: 300 },   // Push to 300 VUs
      { duration: '1m', target: 500 },   // Peak at 500 VUs
      { duration: '30s', target: 0 },    // Ramp down
    ],
    gracefulRampDown: '30s',
  },

  // Soak test - Extended duration test for memory leaks and degradation
  soak: {
    executor: 'constant-vus',
    vus: 50,
    duration: '4h',
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get headers for authenticated requests
 */
export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': API_KEY ? `Bearer ${API_KEY}` : '',
  };
}

/**
 * Generate a random device ID for testing
 */
export function generateDeviceId() {
  return `k6-device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate random device info for registration
 */
export function generateDeviceInfo() {
  const platforms = ['ios', 'android'];
  const osVersions = {
    ios: ['16.0', '16.5', '17.0', '17.1', '17.2'],
    android: ['12', '13', '14'],
  };
  const deviceModels = {
    ios: ['iPhone 14', 'iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro'],
    android: ['Pixel 7', 'Pixel 8', 'Samsung S23', 'Samsung S24'],
  };
  const locales = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP'];
  const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Los_Angeles'];

  const platform = platforms[Math.floor(Math.random() * platforms.length)];

  return {
    platform,
    osVersion: osVersions[platform][Math.floor(Math.random() * osVersions[platform].length)],
    deviceModel: deviceModels[platform][Math.floor(Math.random() * deviceModels[platform].length)],
    locale: locales[Math.floor(Math.random() * locales.length)],
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
  };
}
