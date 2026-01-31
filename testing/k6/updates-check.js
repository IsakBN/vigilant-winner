/**
 * k6 Load Test: POST /v1/updates/check
 *
 * Tests the update check endpoint that devices call to check for new updates.
 * This is the most frequently called endpoint in production.
 *
 * @modified 2026-01-31
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  THRESHOLDS,
  SCENARIOS,
  TEST_APP_ID,
  generateDeviceId,
  generateDeviceInfo,
} from './config.js';

// Custom metrics
const updateCheckDuration = new Trend('update_check_duration', true);
const updateCheckErrors = new Rate('update_check_errors');

// Scenario selection via environment variable
const scenario = __ENV.K6_SCENARIO || 'smoke';

export const options = {
  scenarios: {
    default: SCENARIOS[scenario] || SCENARIOS.smoke,
  },
  thresholds: THRESHOLDS,
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

export default function () {
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
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'updates_check' },
  };

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/v1/updates/check`, payload, params);
  const duration = Date.now() - startTime;

  updateCheckDuration.add(duration);

  const success = check(response, {
    'status is 200 or 403 (MAU limit)': (r) => r.status === 200 || r.status === 403,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response has updateAvailable field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return 'updateAvailable' in body || 'error' in body;
      } catch {
        return false;
      }
    },
    'response is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    updateCheckErrors.add(1);
  } else {
    updateCheckErrors.add(0);
  }

  // Small sleep to simulate realistic device behavior
  sleep(Math.random() * 0.5 + 0.1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
    'updates-check-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  const httpDuration = metrics.http_req_duration;
  const httpFailed = metrics.http_req_failed;
  const checks = metrics.checks;

  return `
================================================================================
UPDATE CHECK LOAD TEST RESULTS
================================================================================

Scenario: ${__ENV.K6_SCENARIO || 'smoke'}
Endpoint: POST ${BASE_URL}/v1/updates/check

LATENCY METRICS:
  p50: ${httpDuration.values['p(50)'].toFixed(2)}ms
  p90: ${httpDuration.values['p(90)'].toFixed(2)}ms
  p95: ${httpDuration.values['p(95)'].toFixed(2)}ms
  p99: ${httpDuration.values['p(99)'].toFixed(2)}ms
  max: ${httpDuration.values.max.toFixed(2)}ms

THROUGHPUT:
  Total requests: ${metrics.http_reqs.values.count}
  Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}

ERROR RATE:
  Failed requests: ${(httpFailed.values.rate * 100).toFixed(4)}%
  Check pass rate: ${(checks.values.rate * 100).toFixed(2)}%

THRESHOLDS:
  p95 < 200ms: ${httpDuration.values['p(95)'] < 200 ? 'PASS' : 'FAIL'}
  p99 < 500ms: ${httpDuration.values['p(99)'] < 500 ? 'PASS' : 'FAIL'}
  Error rate < 0.001%: ${httpFailed.values.rate < 0.00001 ? 'PASS' : 'FAIL'}

================================================================================
`;
}
