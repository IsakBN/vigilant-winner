/**
 * API Helper Functions
 *
 * Wraps BundleNudge API calls for k6 load testing.
 * Handles authentication, request building, and response validation.
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { BASE_URL, TEST_APP_ID, generateDevice, generateUUID } from './data.js';

// =============================================================================
// Custom Metrics
// =============================================================================

/** Update check response time */
export const updateCheckDuration = new Trend('update_check_duration', true);

/** Device registration response time */
export const registerDeviceDuration = new Trend('register_device_duration', true);

/** Telemetry report response time */
export const telemetryDuration = new Trend('telemetry_duration', true);

/** Failed requests rate */
export const failedRequests = new Rate('failed_requests');

/** Successful update checks */
export const successfulUpdateChecks = new Counter('successful_update_checks');

/** Updates available */
export const updatesAvailable = new Counter('updates_available');

/** Rate limited requests */
export const rateLimitedRequests = new Counter('rate_limited_requests');

// =============================================================================
// Request Helpers
// =============================================================================

/**
 * Build standard headers for API requests
 */
export function getHeaders(accessToken) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'BundleNudge-SDK/1.0.0 k6-load-test',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

/**
 * Log and record a failed request
 */
function handleFailure(response, operation) {
  failedRequests.add(1);

  if (response.status === 429) {
    rateLimitedRequests.add(1);
  }

  console.warn(
    `${operation} failed: status=${response.status}, body=${response.body.substring(0, 200)}`
  );
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Register a new device
 *
 * POST /v1/devices/register
 *
 * @param {Object} device - Device data from generateDevice()
 * @param {string} appId - App ID to register with
 * @returns {Object} { success: boolean, accessToken?: string, expiresAt?: number }
 */
export function registerDevice(device, appId = TEST_APP_ID) {
  const url = `${BASE_URL}/v1/devices/register`;

  const payload = JSON.stringify({
    appId,
    deviceId: device.deviceId,
    platform: device.platform,
    appVersion: device.appVersion,
    deviceInfo: device.deviceInfo,
  });

  const response = http.post(url, payload, {
    headers: getHeaders(),
    tags: { name: 'register_device' },
  });

  registerDeviceDuration.add(response.timings.duration);

  const success = check(response, {
    'register: status is 201': (r) => r.status === 201,
    'register: has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.accessToken;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    handleFailure(response, 'registerDevice');
    return { success: false };
  }

  const body = JSON.parse(response.body);
  return {
    success: true,
    accessToken: body.accessToken,
    expiresAt: body.expiresAt,
  };
}

/**
 * Check for available updates
 *
 * POST /v1/updates/check
 *
 * @param {Object} device - Device data
 * @param {string} accessToken - Optional access token
 * @param {string} appId - App ID
 * @returns {Object} { success: boolean, updateAvailable?: boolean, release?: Object }
 */
export function updateCheck(device, accessToken, appId = TEST_APP_ID) {
  const url = `${BASE_URL}/v1/updates/check`;

  const payload = JSON.stringify({
    appId,
    deviceId: device.deviceId,
    platform: device.platform,
    appVersion: device.appVersion,
    currentBundleVersion: device.currentBundleVersion || undefined,
    channel: device.channel || undefined,
    deviceInfo: device.deviceInfo,
  });

  const response = http.post(url, payload, {
    headers: getHeaders(accessToken),
    tags: { name: 'update_check' },
  });

  updateCheckDuration.add(response.timings.duration);

  const success = check(response, {
    'updateCheck: status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'updateCheck: has updateAvailable field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.updateAvailable === 'boolean' || body.error === 'MAU_LIMIT_EXCEEDED';
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    handleFailure(response, 'updateCheck');
    return { success: false };
  }

  successfulUpdateChecks.add(1);

  const body = JSON.parse(response.body);

  if (body.updateAvailable) {
    updatesAvailable.add(1);
  }

  return {
    success: true,
    updateAvailable: body.updateAvailable,
    release: body.release,
    error: body.error,
  };
}

/**
 * Report telemetry event
 *
 * POST /v1/telemetry
 *
 * @param {Object} event - Telemetry event
 * @param {string} accessToken - Access token
 * @param {string} appId - App ID
 * @returns {Object} { success: boolean }
 */
export function reportTelemetry(event, accessToken, appId = TEST_APP_ID) {
  const url = `${BASE_URL}/v1/telemetry`;

  const payload = JSON.stringify({
    appId,
    event,
  });

  const response = http.post(url, payload, {
    headers: getHeaders(accessToken),
    tags: { name: 'telemetry' },
  });

  telemetryDuration.add(response.timings.duration);

  const success = check(response, {
    'telemetry: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  if (!success) {
    handleFailure(response, 'reportTelemetry');
    return { success: false };
  }

  return { success: true };
}

/**
 * Refresh access token
 *
 * POST /v1/devices/refresh
 *
 * @param {string} accessToken - Current access token
 * @returns {Object} { success: boolean, accessToken?: string, expiresAt?: number }
 */
export function refreshToken(accessToken) {
  const url = `${BASE_URL}/v1/devices/refresh`;

  const response = http.post(url, null, {
    headers: getHeaders(accessToken),
    tags: { name: 'refresh_token' },
  });

  const success = check(response, {
    'refresh: status is 200': (r) => r.status === 200,
    'refresh: has new token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.accessToken;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    handleFailure(response, 'refreshToken');
    return { success: false };
  }

  const body = JSON.parse(response.body);
  return {
    success: true,
    accessToken: body.accessToken,
    expiresAt: body.expiresAt,
  };
}

/**
 * Health check endpoint
 *
 * GET /health
 *
 * @returns {Object} { success: boolean, status?: string }
 */
export function healthCheck() {
  const url = `${BASE_URL}/health`;

  const response = http.get(url, {
    headers: { 'User-Agent': 'k6-load-test' },
    tags: { name: 'health_check' },
  });

  const success = check(response, {
    'health: status is 200': (r) => r.status === 200,
  });

  if (!success) {
    return { success: false };
  }

  try {
    const body = JSON.parse(response.body);
    return { success: true, status: body.status };
  } catch {
    return { success: true, status: 'ok' };
  }
}

// =============================================================================
// Test Scenarios
// =============================================================================

/**
 * Simulate a complete device session:
 * 1. Register device
 * 2. Check for updates
 * 3. If update available, report telemetry
 */
export function simulateDeviceSession(device, appId = TEST_APP_ID) {
  // Register device
  const registerResult = registerDevice(device, appId);
  if (!registerResult.success) {
    return { success: false, stage: 'register' };
  }

  // Check for updates
  const checkResult = updateCheck(device, registerResult.accessToken, appId);
  if (!checkResult.success) {
    return { success: false, stage: 'updateCheck' };
  }

  // If update available, simulate applying and reporting
  if (checkResult.updateAvailable && checkResult.release) {
    const telemetryResult = reportTelemetry(
      {
        type: 'applied',
        version: checkResult.release.version,
        previousVersion: device.currentBundleVersion,
      },
      registerResult.accessToken,
      appId
    );

    return {
      success: telemetryResult.success,
      stage: 'complete',
      updateApplied: true,
      version: checkResult.release.version,
    };
  }

  return {
    success: true,
    stage: 'complete',
    updateApplied: false,
  };
}

/**
 * Simulate just an update check (for existing devices)
 * This is the most common API call pattern
 */
export function simulateUpdateCheck(appId = TEST_APP_ID) {
  const device = generateDevice();
  return updateCheck(device, null, appId);
}
