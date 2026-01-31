/**
 * k6 Load Test: Combined API Endpoints
 *
 * Tests all three endpoints together with realistic traffic distribution:
 * - POST /v1/updates/check (70% of traffic)
 * - GET /v1/bundles/:id/download (20% of traffic)
 * - POST /v1/devices/register (10% of traffic)
 *
 * @modified 2026-01-31
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  BASE_URL,
  THRESHOLDS,
  SCENARIOS,
  TEST_APP_ID,
  TEST_RELEASE_ID,
  API_KEY,
  generateDeviceId,
  generateDeviceInfo,
} from './config.js';

// Custom metrics per endpoint
const updateCheckDuration = new Trend('update_check_duration', true);
const bundleDownloadDuration = new Trend('bundle_download_duration', true);
const deviceRegisterDuration = new Trend('device_register_duration', true);

const updateCheckErrors = new Rate('update_check_errors');
const bundleDownloadErrors = new Rate('bundle_download_errors');
const deviceRegisterErrors = new Rate('device_register_errors');

const endpointCalls = new Counter('endpoint_calls');

// Scenario selection via environment variable
const scenario = __ENV.K6_SCENARIO || 'smoke';

export const options = {
  scenarios: {
    default: SCENARIOS[scenario] || SCENARIOS.smoke,
  },
  thresholds: {
    ...THRESHOLDS,
    'update_check_duration': ['p(95)<200', 'p(99)<500'],
    'bundle_download_duration': ['p(95)<300', 'p(99)<600'],
    'device_register_duration': ['p(95)<200', 'p(99)<500'],
  },
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

/**
 * Update check request (70% of traffic)
 */
function testUpdateCheck() {
  const deviceId = generateDeviceId();
  const deviceInfo = generateDeviceInfo();

  const payload = JSON.stringify({
    appId: TEST_APP_ID,
    deviceId: deviceId,
    platform: deviceInfo.platform,
    appVersion: '1.0.0',
    currentBundleVersion: '1.0.0',
    deviceInfo: {
      osVersion: deviceInfo.osVersion,
      deviceModel: deviceInfo.deviceModel,
      locale: deviceInfo.locale,
      timezone: deviceInfo.timezone,
    },
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'updates_check' },
  };

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/v1/updates/check`, payload, params);
  updateCheckDuration.add(Date.now() - startTime);
  endpointCalls.add(1, { endpoint: 'updates_check' });

  const success = check(response, {
    'update_check: status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'update_check: response time < 200ms': (r) => r.timings.duration < 200,
  });

  updateCheckErrors.add(success ? 0 : 1);
}

/**
 * Bundle download request (20% of traffic)
 */
function testBundleDownload() {
  const params = {
    headers: {
      'Authorization': API_KEY ? `Bearer ${API_KEY}` : '',
    },
    tags: { endpoint: 'bundle_download' },
    responseType: 'binary',
  };

  const url = `${BASE_URL}/v1/bundles/${TEST_APP_ID}/${TEST_RELEASE_ID}/bundle.js`;

  const startTime = Date.now();
  const response = http.get(url, params);
  bundleDownloadDuration.add(Date.now() - startTime);
  endpointCalls.add(1, { endpoint: 'bundle_download' });

  const success = check(response, {
    'bundle_download: status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'bundle_download: response time < 500ms': (r) => r.timings.duration < 500,
  });

  bundleDownloadErrors.add(success ? 0 : 1);
}

/**
 * Device register request (10% of traffic)
 */
function testDeviceRegister() {
  const deviceId = generateDeviceId();
  const deviceInfo = generateDeviceInfo();

  const payload = JSON.stringify({
    appId: TEST_APP_ID,
    deviceId: deviceId,
    platform: deviceInfo.platform,
    appVersion: '1.0.0',
    deviceInfo: {
      osVersion: deviceInfo.osVersion,
      deviceModel: deviceInfo.deviceModel,
      locale: deviceInfo.locale,
      timezone: deviceInfo.timezone,
    },
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'device_register' },
  };

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/v1/devices/register`, payload, params);
  deviceRegisterDuration.add(Date.now() - startTime);
  endpointCalls.add(1, { endpoint: 'device_register' });

  const success = check(response, {
    'device_register: status is 201 or 400': (r) => r.status === 201 || r.status === 400,
    'device_register: response time < 200ms': (r) => r.timings.duration < 200,
  });

  deviceRegisterErrors.add(success ? 0 : 1);
}

export default function () {
  // Traffic distribution: 70% update check, 20% bundle download, 10% device register
  const rand = Math.random() * 100;

  if (rand < 70) {
    group('Update Check', () => {
      testUpdateCheck();
    });
  } else if (rand < 90) {
    group('Bundle Download', () => {
      testBundleDownload();
    });
  } else {
    group('Device Register', () => {
      testDeviceRegister();
    });
  }

  // Variable sleep to simulate realistic traffic patterns
  sleep(Math.random() * 0.5 + 0.1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
    'combined-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  const httpDuration = metrics.http_req_duration;
  const httpFailed = metrics.http_req_failed;
  const checks = metrics.checks;

  const updateCheck = metrics.update_check_duration;
  const bundleDownload = metrics.bundle_download_duration;
  const deviceRegister = metrics.device_register_duration;

  function formatMetric(m) {
    if (!m || !m.values) return 'N/A';
    return `p50=${m.values['p(50)'].toFixed(0)}ms, p95=${m.values['p(95)'].toFixed(0)}ms, p99=${m.values['p(99)'].toFixed(0)}ms`;
  }

  return `
================================================================================
COMBINED LOAD TEST RESULTS
================================================================================

Scenario: ${__ENV.K6_SCENARIO || 'smoke'}
Base URL: ${BASE_URL}

OVERALL LATENCY:
  p50: ${httpDuration.values['p(50)'].toFixed(2)}ms
  p90: ${httpDuration.values['p(90)'].toFixed(2)}ms
  p95: ${httpDuration.values['p(95)'].toFixed(2)}ms
  p99: ${httpDuration.values['p(99)'].toFixed(2)}ms
  max: ${httpDuration.values.max.toFixed(2)}ms

PER-ENDPOINT LATENCY:
  Update Check:     ${formatMetric(updateCheck)}
  Bundle Download:  ${formatMetric(bundleDownload)}
  Device Register:  ${formatMetric(deviceRegister)}

THROUGHPUT:
  Total requests: ${metrics.http_reqs.values.count}
  Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}

ERROR RATES:
  Overall failed: ${(httpFailed.values.rate * 100).toFixed(4)}%
  Check pass rate: ${(checks.values.rate * 100).toFixed(2)}%

THRESHOLDS:
  p95 < 200ms: ${httpDuration.values['p(95)'] < 200 ? 'PASS' : 'FAIL'}
  p99 < 500ms: ${httpDuration.values['p(99)'] < 500 ? 'PASS' : 'FAIL'}
  Error rate < 0.001%: ${httpFailed.values.rate < 0.00001 ? 'PASS' : 'FAIL'}

================================================================================
`;
}
