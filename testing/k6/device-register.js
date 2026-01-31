/**
 * k6 Load Test: POST /v1/devices/register
 *
 * Tests the device registration endpoint.
 * Called by SDK on first launch to register device and get access token.
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
const registerDuration = new Trend('device_register_duration', true);
const registerErrors = new Rate('device_register_errors');
const tokenReceived = new Rate('token_received');

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
    tags: { endpoint: 'device_register' },
  };

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/v1/devices/register`, payload, params);
  const duration = Date.now() - startTime;

  registerDuration.add(duration);

  const success = check(response, {
    'status is 201 or 400 (invalid app)': (r) => r.status === 201 || r.status === 400,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
    'has accessToken on success': (r) => {
      if (r.status !== 201) return true;
      try {
        const body = JSON.parse(r.body);
        return 'accessToken' in body;
      } catch {
        return false;
      }
    },
    'has expiresAt on success': (r) => {
      if (r.status !== 201) return true;
      try {
        const body = JSON.parse(r.body);
        return 'expiresAt' in body;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    registerErrors.add(1);
  } else {
    registerErrors.add(0);
  }

  // Track token generation success
  if (response.status === 201) {
    try {
      const body = JSON.parse(response.body);
      tokenReceived.add('accessToken' in body ? 1 : 0);
    } catch {
      tokenReceived.add(0);
    }
  }

  // Simulate realistic registration intervals (less frequent than update checks)
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
    'device-register-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  const httpDuration = metrics.http_req_duration;
  const httpFailed = metrics.http_req_failed;
  const checks = metrics.checks;
  const tokens = metrics.token_received;

  let tokenRate = 'N/A';
  if (tokens && tokens.values && tokens.values.rate !== undefined) {
    tokenRate = `${(tokens.values.rate * 100).toFixed(2)}%`;
  }

  return `
================================================================================
DEVICE REGISTER LOAD TEST RESULTS
================================================================================

Scenario: ${__ENV.K6_SCENARIO || 'smoke'}
Endpoint: POST ${BASE_URL}/v1/devices/register

LATENCY METRICS:
  p50: ${httpDuration.values['p(50)'].toFixed(2)}ms
  p90: ${httpDuration.values['p(90)'].toFixed(2)}ms
  p95: ${httpDuration.values['p(95)'].toFixed(2)}ms
  p99: ${httpDuration.values['p(99)'].toFixed(2)}ms
  max: ${httpDuration.values.max.toFixed(2)}ms

THROUGHPUT:
  Total requests: ${metrics.http_reqs.values.count}
  Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}

TOKEN GENERATION:
  Token received rate: ${tokenRate}

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
