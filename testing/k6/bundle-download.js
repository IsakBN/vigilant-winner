/**
 * k6 Load Test: GET /v1/bundles/:appId/:releaseId/bundle.js
 *
 * Tests the bundle download endpoint.
 * This endpoint is called when devices need to download a new bundle.
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
  TEST_RELEASE_ID,
  API_KEY,
} from './config.js';

// Custom metrics
const bundleDownloadDuration = new Trend('bundle_download_duration', true);
const bundleDownloadErrors = new Rate('bundle_download_errors');
const bundleSize = new Trend('bundle_size_bytes');

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
  const params = {
    headers: {
      'Authorization': API_KEY ? `Bearer ${API_KEY}` : '',
    },
    tags: { endpoint: 'bundle_download' },
    // Don't decompress - we want raw bytes
    responseType: 'binary',
  };

  const url = `${BASE_URL}/v1/bundles/${TEST_APP_ID}/${TEST_RELEASE_ID}/bundle.js`;

  const startTime = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - startTime;

  bundleDownloadDuration.add(duration);

  const success = check(response, {
    'status is 200 or 404 (bundle not found)': (r) => r.status === 200 || r.status === 404,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has content-type header': (r) => {
      const ct = r.headers['Content-Type'] || r.headers['content-type'];
      return ct !== undefined;
    },
    'cache headers present for 200': (r) => {
      if (r.status !== 200) return true;
      const cc = r.headers['Cache-Control'] || r.headers['cache-control'];
      return cc !== undefined;
    },
  });

  if (!success) {
    bundleDownloadErrors.add(1);
  } else {
    bundleDownloadErrors.add(0);
  }

  // Track bundle size if download succeeded
  if (response.status === 200 && response.body) {
    bundleSize.add(response.body.length);
  }

  // Simulate realistic download intervals
  sleep(Math.random() * 1 + 0.5);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
    'bundle-download-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  const httpDuration = metrics.http_req_duration;
  const httpFailed = metrics.http_req_failed;
  const checks = metrics.checks;
  const size = metrics.bundle_size_bytes;

  let sizeInfo = 'N/A (no successful downloads)';
  if (size && size.values && size.values.avg) {
    sizeInfo = `${(size.values.avg / 1024).toFixed(2)} KB avg`;
  }

  return `
================================================================================
BUNDLE DOWNLOAD LOAD TEST RESULTS
================================================================================

Scenario: ${__ENV.K6_SCENARIO || 'smoke'}
Endpoint: GET ${BASE_URL}/v1/bundles/:appId/:releaseId/bundle.js

LATENCY METRICS:
  p50: ${httpDuration.values['p(50)'].toFixed(2)}ms
  p90: ${httpDuration.values['p(90)'].toFixed(2)}ms
  p95: ${httpDuration.values['p(95)'].toFixed(2)}ms
  p99: ${httpDuration.values['p(99)'].toFixed(2)}ms
  max: ${httpDuration.values.max.toFixed(2)}ms

THROUGHPUT:
  Total requests: ${metrics.http_reqs.values.count}
  Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}

BUNDLE SIZE:
  ${sizeInfo}

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
