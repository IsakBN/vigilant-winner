/**
 * Spike Test
 *
 * Tests the API's ability to handle sudden traffic spikes.
 * Simulates scenarios like:
 * - App going viral
 * - Push notification sent to all users
 * - Marketing campaign launch
 * - Geographic traffic shift
 *
 * Pattern: Instant spike from 0 to 1000 VUs, sustain, then drop
 *
 * Run: k6 run scenarios/spike.js
 */

import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import {
  updateCheck,
  registerDevice,
  healthCheck,
  failedRequests,
  updateCheckDuration,
} from '../helpers/api.js';
import { generateDevice, TEST_APP_ID } from '../helpers/data.js';

// =============================================================================
// Custom Spike Metrics
// =============================================================================

/** Requests during spike phase */
const spikePhaseRequests = new Counter('spike_phase_requests');

/** Response time during spike */
const spikeResponseTime = new Trend('spike_response_time', true);

/** Recovery time after spike */
const recoveryResponseTime = new Trend('recovery_response_time', true);

/** Errors during spike */
const spikeErrors = new Rate('spike_errors');

// =============================================================================
// Configuration
// =============================================================================

export const options = {
  scenarios: {
    // Warm-up phase
    warmup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '0s',
      tags: { phase: 'warmup' },
    },

    // Sudden spike - instant jump to 1000 VUs
    spike: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '1m',
      startTime: '30s',
      tags: { phase: 'spike' },
    },

    // Sustain spike
    sustain: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '2m',
      startTime: '1m30s',
      tags: { phase: 'sustain' },
    },

    // Recovery phase - drop to normal load
    recovery: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      startTime: '3m30s',
      exec: 'recoveryPhase',
      tags: { phase: 'recovery' },
    },
  },

  // Spike test thresholds - more lenient during spike
  thresholds: {
    // During spike, allow higher latency
    'update_check_duration': [
      'p(50)<500',   // Median < 500ms
      'p(95)<2000',  // 95th < 2s (more lenient)
      'p(99)<5000',  // 99th < 5s
    ],

    // Allow slightly higher error rate during spike
    'failed_requests': ['rate<0.05'],  // < 5% failures

    // HTTP errors
    'http_req_failed': ['rate<0.05'],

    // Spike-specific: recovery should be faster
    'recovery_response_time': [
      'p(95)<500',  // Recovery should be fast
    ],
  },

  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// =============================================================================
// Setup
// =============================================================================

export function setup() {
  console.log('='.repeat(60));
  console.log('SPIKE TEST - SUDDEN TRAFFIC SURGE');
  console.log('='.repeat(60));
  console.log(`Target API: ${__ENV.BASE_URL || 'http://localhost:8787'}`);
  console.log(`App ID: ${TEST_APP_ID}`);
  console.log('');
  console.log('Test phases:');
  console.log('  0:00 - 0:30  : Warmup (10 VUs)');
  console.log('  0:30 - 1:30  : SPIKE (0 -> 1000 VUs instant)');
  console.log('  1:30 - 3:30  : Sustain (1000 VUs)');
  console.log('  3:30 - 4:30  : Recovery (50 VUs)');
  console.log('');

  // Health check
  const health = healthCheck();
  if (!health.success) {
    console.error('FATAL: API health check failed!');
    return { healthy: false };
  }

  console.log('Health check: PASSED');
  console.log('='.repeat(60));

  return {
    healthy: true,
    startTime: Date.now(),
    phases: {
      warmup: { start: 0, end: 30000 },
      spike: { start: 30000, end: 90000 },
      sustain: { start: 90000, end: 210000 },
      recovery: { start: 210000, end: 270000 },
    },
  };
}

// =============================================================================
// Scenarios
// =============================================================================

/**
 * Main spike scenario
 */
export default function spikeScenario(data) {
  if (!data.healthy) {
    sleep(1);
    return;
  }

  const elapsed = Date.now() - data.startTime;
  const device = generateDevice();

  const startTime = Date.now();
  const result = updateCheck(device, null, TEST_APP_ID);
  const duration = Date.now() - startTime;

  // Track phase-specific metrics
  if (elapsed >= data.phases.spike.start && elapsed < data.phases.sustain.end) {
    spikePhaseRequests.add(1);
    spikeResponseTime.add(duration);

    if (!result.success) {
      spikeErrors.add(1);
    } else {
      spikeErrors.add(0);
    }
  }

  // Aggressive pacing during spike to maximize load
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds
}

/**
 * Recovery phase - monitor how quickly the API returns to normal
 */
export function recoveryPhase(data) {
  if (!data.healthy) {
    sleep(1);
    return;
  }

  const device = generateDevice();
  const startTime = Date.now();

  const result = updateCheck(device, null, TEST_APP_ID);

  const duration = Date.now() - startTime;
  recoveryResponseTime.add(duration);

  // Normal pacing during recovery
  sleep(Math.random() * 2 + 1);
}

// =============================================================================
// Teardown
// =============================================================================

export function teardown(data) {
  console.log('');
  console.log('='.repeat(60));
  console.log('SPIKE TEST COMPLETE');
  console.log('='.repeat(60));

  if (!data.healthy) {
    console.log('Test was aborted');
    return;
  }

  const duration = ((Date.now() - data.startTime) / 1000).toFixed(1);
  console.log(`Total duration: ${duration}s`);
  console.log('='.repeat(60));
}

// =============================================================================
// Custom Summary
// =============================================================================

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    testType: 'spike',
    appId: TEST_APP_ID,
    baseUrl: __ENV.BASE_URL || 'http://localhost:8787',

    // Spike-specific metrics
    metrics: {
      totalRequests: data.metrics.http_reqs?.values?.count || 0,
      successRate:
        ((1 - (data.metrics.http_req_failed?.values?.rate || 0)) * 100).toFixed(2) + '%',

      // Spike phase analysis
      spikePhase: {
        requests: data.metrics.spike_phase_requests?.values?.count || 0,
        errorRate:
          ((data.metrics.spike_errors?.values?.rate || 0) * 100).toFixed(2) + '%',
        responseTime: {
          avg: data.metrics.spike_response_time?.values?.avg?.toFixed(2) + 'ms',
          p50: data.metrics.spike_response_time?.values?.['p(50)']?.toFixed(2) + 'ms',
          p95: data.metrics.spike_response_time?.values?.['p(95)']?.toFixed(2) + 'ms',
          p99: data.metrics.spike_response_time?.values?.['p(99)']?.toFixed(2) + 'ms',
          max: data.metrics.spike_response_time?.values?.max?.toFixed(2) + 'ms',
        },
      },

      // Recovery analysis
      recoveryPhase: {
        responseTime: {
          avg: data.metrics.recovery_response_time?.values?.avg?.toFixed(2) + 'ms',
          p95: data.metrics.recovery_response_time?.values?.['p(95)']?.toFixed(2) + 'ms',
        },
      },

      // Overall response time
      overall: {
        p50: data.metrics.update_check_duration?.values?.['p(50)']?.toFixed(2) + 'ms',
        p95: data.metrics.update_check_duration?.values?.['p(95)']?.toFixed(2) + 'ms',
        p99: data.metrics.update_check_duration?.values?.['p(99)']?.toFixed(2) + 'ms',
      },
    },

    // Analysis
    analysis: {
      // How much did response time increase during spike?
      spikeImpact:
        data.metrics.spike_response_time?.values?.['p(95)'] /
        (data.metrics.recovery_response_time?.values?.['p(95)'] || 1),

      // Did the system handle the spike?
      spikeHandled:
        (data.metrics.spike_errors?.values?.rate || 0) < 0.05 ? 'YES' : 'NO',

      // Did it recover quickly?
      quickRecovery:
        (data.metrics.recovery_response_time?.values?.['p(95)'] || 0) < 500
          ? 'YES'
          : 'NO',
    },

    thresholds: {},
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
    'results/spike-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
