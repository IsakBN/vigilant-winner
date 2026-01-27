/**
 * Soak Test (Endurance Test)
 *
 * Tests the API under sustained load for an extended period.
 * Designed to detect:
 * - Memory leaks
 * - Resource exhaustion
 * - Response time degradation over time
 * - Connection pool issues
 * - Database connection leaks
 *
 * Duration: 24 hours at constant 50 VUs
 *
 * Run: k6 run --duration 24h scenarios/soak.js
 * Or:  k6 run scenarios/soak.js (uses default 24h)
 */

import { sleep } from 'k6';
import { Trend, Counter, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import {
  updateCheck,
  healthCheck,
  updateCheckDuration,
  failedRequests,
} from '../helpers/api.js';
import { generateDevice, TEST_APP_ID } from '../helpers/data.js';

// =============================================================================
// Custom Soak Metrics
// =============================================================================

/** Response time per hour bucket */
const hourlyResponseTime = new Trend('hourly_response_time', true);

/** Errors per hour */
const hourlyErrors = new Counter('hourly_errors');

/** Current hour of test */
const currentHour = new Gauge('current_hour');

/** Peak response time seen */
const peakResponseTime = new Gauge('peak_response_time');

// =============================================================================
// Configuration
// =============================================================================

export const options = {
  scenarios: {
    // Constant load for soak testing
    soak: {
      executor: 'constant-vus',
      vus: 50,
      duration: '24h',
      gracefulStop: '5m',
    },

    // Periodic health checks
    health_monitor: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '1m',
      duration: '24h',
      preAllocatedVUs: 1,
      maxVUs: 2,
      exec: 'healthMonitor',
    },
  },

  // Soak test specific thresholds
  thresholds: {
    // Response times should remain stable
    'update_check_duration': [
      'p(50)<300',   // Median < 300ms
      'p(95)<800',   // 95th < 800ms
      'p(99)<1500',  // 99th < 1.5s
    ],

    // Very low error tolerance for soak
    'failed_requests': ['rate<0.005'],  // < 0.5% failures

    // HTTP errors
    'http_req_failed': ['rate<0.005'],

    // Ensure we're actually generating load
    'http_reqs': ['rate>5'],  // At least 5 req/s
  },

  // Extended summary stats for trend analysis
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// =============================================================================
// Shared State
// =============================================================================

let testStartTime = 0;
let maxResponseTime = 0;

// =============================================================================
// Setup
// =============================================================================

export function setup() {
  console.log('='.repeat(60));
  console.log('SOAK TEST - 24 HOUR ENDURANCE');
  console.log('='.repeat(60));
  console.log(`Target API: ${__ENV.BASE_URL || 'http://localhost:8787'}`);
  console.log(`App ID: ${TEST_APP_ID}`);
  console.log(`VUs: 50 constant`);
  console.log(`Duration: 24 hours`);
  console.log('');

  // Initial health check
  const health = healthCheck();
  if (!health.success) {
    console.error('FATAL: API health check failed! Cannot start soak test.');
    return { healthy: false };
  }

  console.log('Initial health check: PASSED');
  console.log('Starting soak test at: ' + new Date().toISOString());
  console.log('='.repeat(60));

  return {
    healthy: true,
    startTime: Date.now(),
    hourlyStats: [],
  };
}

// =============================================================================
// Main Scenario
// =============================================================================

export default function soakTest(data) {
  if (!data.healthy) {
    sleep(10);
    return;
  }

  // Calculate current hour of test
  const elapsedHours = Math.floor((Date.now() - data.startTime) / (1000 * 60 * 60));
  currentHour.add(elapsedHours);

  // Generate device and check for update
  const device = generateDevice();
  const startTime = Date.now();

  const result = updateCheck(device, null, TEST_APP_ID);

  const duration = Date.now() - startTime;

  // Track hourly response time
  hourlyResponseTime.add(duration);

  // Track peak response time
  if (duration > maxResponseTime) {
    maxResponseTime = duration;
    peakResponseTime.add(duration);
  }

  if (!result.success) {
    hourlyErrors.add(1);
  }

  // Consistent pacing for soak test
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

// =============================================================================
// Health Monitor
// =============================================================================

export function healthMonitor(data) {
  if (!data.healthy) return;

  const health = healthCheck();
  const elapsedHours = Math.floor((Date.now() - data.startTime) / (1000 * 60 * 60));

  if (health.success) {
    console.log(`[Hour ${elapsedHours}] Health check: OK`);
  } else {
    console.error(`[Hour ${elapsedHours}] Health check: FAILED`);
  }
}

// =============================================================================
// Teardown
// =============================================================================

export function teardown(data) {
  console.log('');
  console.log('='.repeat(60));
  console.log('SOAK TEST COMPLETE');
  console.log('='.repeat(60));

  if (!data.healthy) {
    console.log('Test was aborted due to initial health check failure');
    return;
  }

  const durationHours = ((Date.now() - data.startTime) / (1000 * 60 * 60)).toFixed(2);
  console.log(`Total duration: ${durationHours} hours`);
  console.log(`Peak response time: ${maxResponseTime}ms`);
  console.log('End time: ' + new Date().toISOString());
  console.log('='.repeat(60));
}

// =============================================================================
// Custom Summary
// =============================================================================

export function handleSummary(data) {
  const durationHours = data.state?.testRunDurationMs
    ? (data.state.testRunDurationMs / (1000 * 60 * 60)).toFixed(2)
    : 'N/A';

  const summary = {
    // Test metadata
    timestamp: new Date().toISOString(),
    testType: 'soak',
    appId: TEST_APP_ID,
    baseUrl: __ENV.BASE_URL || 'http://localhost:8787',
    durationHours,

    // Key metrics for soak analysis
    metrics: {
      totalRequests: data.metrics.http_reqs?.values?.count || 0,
      successRate:
        ((1 - (data.metrics.http_req_failed?.values?.rate || 0)) * 100).toFixed(3) + '%',

      responseTime: {
        avg: data.metrics.update_check_duration?.values?.avg?.toFixed(2) + 'ms',
        min: data.metrics.update_check_duration?.values?.min?.toFixed(2) + 'ms',
        max: data.metrics.update_check_duration?.values?.max?.toFixed(2) + 'ms',
        p50: data.metrics.update_check_duration?.values?.['p(50)']?.toFixed(2) + 'ms',
        p95: data.metrics.update_check_duration?.values?.['p(95)']?.toFixed(2) + 'ms',
        p99: data.metrics.update_check_duration?.values?.['p(99)']?.toFixed(2) + 'ms',
      },

      // Degradation indicator
      // Compare max to average - high ratio indicates degradation
      degradationRatio:
        data.metrics.update_check_duration?.values?.max /
        (data.metrics.update_check_duration?.values?.avg || 1),
    },

    // Threshold results
    thresholds: {},

    // Soak-specific analysis
    analysis: {
      memoryLeakRisk:
        data.metrics.update_check_duration?.values?.max >
        data.metrics.update_check_duration?.values?.avg * 10
          ? 'HIGH'
          : 'LOW',
      stabilityScore:
        (1 - (data.metrics.http_req_failed?.values?.rate || 0)) > 0.999
          ? 'EXCELLENT'
          : (1 - (data.metrics.http_req_failed?.values?.rate || 0)) > 0.99
            ? 'GOOD'
            : (1 - (data.metrics.http_req_failed?.values?.rate || 0)) > 0.95
              ? 'FAIR'
              : 'POOR',
    },
  };

  // Add threshold results
  for (const [name, metric] of Object.entries(data.metrics)) {
    if (metric.thresholds) {
      summary.thresholds[name] = {};
      for (const [thresholdName, passed] of Object.entries(metric.thresholds)) {
        summary.thresholds[name][thresholdName] = passed ? 'PASS' : 'FAIL';
      }
    }
  }

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'results/soak-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
