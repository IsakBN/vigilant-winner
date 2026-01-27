/**
 * Standard Load Test
 *
 * Tests the API under typical production load patterns.
 * Simulates devices checking for updates throughout the day.
 *
 * Stages:
 * 1. Ramp up: 0 -> 100 VUs over 1 minute
 * 2. Sustain: 100 VUs for 5 minutes
 * 3. Spike: 100 -> 500 VUs over 30 seconds
 * 4. Sustain spike: 500 VUs for 2 minutes
 * 5. Ramp down: 500 -> 0 over 1 minute
 *
 * Run: k6 run scenarios/index.js
 */

import { sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import {
  updateCheck,
  registerDevice,
  healthCheck,
  successfulUpdateChecks,
  updatesAvailable,
  failedRequests,
  rateLimitedRequests,
  updateCheckDuration,
  registerDeviceDuration,
} from '../helpers/api.js';
import { generateDevice, TEST_APP_ID } from '../helpers/data.js';

// =============================================================================
// Configuration
// =============================================================================

export const options = {
  scenarios: {
    // Main update check scenario
    update_checks: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   // Ramp up
        { duration: '5m', target: 100 },   // Sustain
        { duration: '30s', target: 500 },  // Spike
        { duration: '2m', target: 500 },   // Sustain spike
        { duration: '1m', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'update_checks' },
    },

    // Device registration scenario (lower volume)
    registrations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'registrations' },
    },
  },

  // Performance thresholds
  thresholds: {
    // Response time thresholds
    'update_check_duration': [
      'p(50)<200',   // 50th percentile < 200ms
      'p(95)<500',   // 95th percentile < 500ms
      'p(99)<1000',  // 99th percentile < 1s
    ],
    'register_device_duration': [
      'p(50)<300',
      'p(95)<800',
      'p(99)<1500',
    ],

    // Error rate thresholds
    'failed_requests': ['rate<0.01'],  // < 1% failure rate

    // Success rate thresholds
    'http_req_failed': ['rate<0.01'],  // < 1% HTTP errors

    // Request rate (for monitoring)
    'http_reqs': ['rate>10'],  // At least 10 req/s during test
  },

  // Output configuration
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// =============================================================================
// Setup
// =============================================================================

export function setup() {
  console.log('Starting load test...');
  console.log(`Target API: ${__ENV.BASE_URL || 'http://localhost:8787'}`);
  console.log(`App ID: ${TEST_APP_ID}`);

  // Verify API is healthy before starting
  const health = healthCheck();
  if (!health.success) {
    console.error('API health check failed! Aborting test.');
    return { healthy: false };
  }

  console.log('API health check passed');
  return {
    healthy: true,
    startTime: Date.now(),
  };
}

// =============================================================================
// Scenarios
// =============================================================================

/**
 * Update check scenario - simulates devices checking for updates
 */
export default function updateCheckScenario(data) {
  if (!data.healthy) {
    console.error('Skipping iteration - API unhealthy');
    sleep(1);
    return;
  }

  // Generate a random device
  const device = generateDevice();

  // Check for updates
  const result = updateCheck(device, null, TEST_APP_ID);

  if (!result.success) {
    // Log but don't fail - metrics will capture this
    console.warn(`Update check failed for device ${device.deviceId}`);
  }

  // Simulate realistic device behavior
  // Devices typically check every 5-30 seconds in background
  sleep(Math.random() * 2 + 1); // 1-3 seconds between requests
}

/**
 * Device registration scenario - simulates new device registrations
 */
export function registrations(data) {
  if (!data.healthy) {
    sleep(1);
    return;
  }

  // Generate a new device
  const device = generateDevice();

  // Register the device
  const result = registerDevice(device, TEST_APP_ID);

  if (!result.success) {
    console.warn(`Registration failed for device ${device.deviceId}`);
  }

  // New registrations are less frequent than update checks
  sleep(Math.random() * 5 + 2); // 2-7 seconds between registrations
}

// =============================================================================
// Teardown
// =============================================================================

export function teardown(data) {
  if (!data.healthy) {
    console.log('Test aborted due to unhealthy API');
    return;
  }

  const duration = ((Date.now() - data.startTime) / 1000).toFixed(1);
  console.log(`Load test completed in ${duration}s`);
}

// =============================================================================
// Custom Summary
// =============================================================================

export function handleSummary(data) {
  const summary = {
    // Test metadata
    timestamp: new Date().toISOString(),
    testType: 'load',
    appId: TEST_APP_ID,
    baseUrl: __ENV.BASE_URL || 'http://localhost:8787',

    // Key metrics
    metrics: {
      totalRequests: data.metrics.http_reqs?.values?.count || 0,
      failedRequests: data.metrics.http_req_failed?.values?.passes || 0,
      successRate:
        ((1 - (data.metrics.http_req_failed?.values?.rate || 0)) * 100).toFixed(2) + '%',

      updateChecks: {
        total: data.metrics.successful_update_checks?.values?.count || 0,
        updatesFound: data.metrics.updates_available?.values?.count || 0,
        p50: data.metrics.update_check_duration?.values?.['p(50)']?.toFixed(2) + 'ms',
        p95: data.metrics.update_check_duration?.values?.['p(95)']?.toFixed(2) + 'ms',
        p99: data.metrics.update_check_duration?.values?.['p(99)']?.toFixed(2) + 'ms',
      },

      registrations: {
        p50: data.metrics.register_device_duration?.values?.['p(50)']?.toFixed(2) + 'ms',
        p95: data.metrics.register_device_duration?.values?.['p(95)']?.toFixed(2) + 'ms',
        p99: data.metrics.register_device_duration?.values?.['p(99)']?.toFixed(2) + 'ms',
      },

      rateLimited: data.metrics.rate_limited_requests?.values?.count || 0,
    },

    // Threshold results
    thresholds: {},
  };

  // Add threshold pass/fail status
  for (const [name, threshold] of Object.entries(data.metrics)) {
    if (threshold.thresholds) {
      summary.thresholds[name] = {};
      for (const [thresholdName, passed] of Object.entries(threshold.thresholds)) {
        summary.thresholds[name][thresholdName] = passed ? 'PASS' : 'FAIL';
      }
    }
  }

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'results/load-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
