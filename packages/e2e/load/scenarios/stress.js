/**
 * Stress Test
 *
 * Pushes the API beyond normal operating capacity to find:
 * - Breaking point (max load before failures)
 * - Error behavior under extreme load
 * - Recovery characteristics
 * - Resource limits
 *
 * Pattern: Gradual ramp from 0 to 2000 VUs over 10 minutes
 *
 * Run: k6 run scenarios/stress.js
 */

import { sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import {
  updateCheck,
  healthCheck,
  failedRequests,
  updateCheckDuration,
} from '../helpers/api.js';
import { generateDevice, TEST_APP_ID } from '../helpers/data.js';

// =============================================================================
// Custom Stress Metrics
// =============================================================================

/** VU count when first error occurred */
const firstErrorVUs = new Gauge('first_error_vus');

/** VU count when error rate exceeded 5% */
const breakingPointVUs = new Gauge('breaking_point_vus');

/** Successful requests at each VU level */
const vuLevelSuccesses = new Counter('vu_level_successes');

/** Error rate at each VU level */
const vuLevelErrors = new Rate('vu_level_errors');

/** Response time at high load */
const highLoadResponseTime = new Trend('high_load_response_time', true);

// =============================================================================
// Tracking State
// =============================================================================

let firstErrorRecorded = false;
let breakingPointRecorded = false;
let errorCount = 0;
let totalCount = 0;

// =============================================================================
// Configuration
// =============================================================================

export const options = {
  scenarios: {
    // Gradual stress ramp
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Gradual ramp to find limits
        { duration: '1m', target: 100 },    // Warm up
        { duration: '2m', target: 500 },    // Medium load
        { duration: '2m', target: 1000 },   // High load
        { duration: '3m', target: 1500 },   // Very high load
        { duration: '2m', target: 2000 },   // Extreme load
        { duration: '2m', target: 2000 },   // Sustain at max
        { duration: '1m', target: 0 },      // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },

  // Stress test thresholds - intentionally lenient to observe behavior
  thresholds: {
    // Just track, don't fail
    'update_check_duration': [
      'p(50)<1000',  // Median under 1s
      'p(95)<5000',  // 95th under 5s
    ],

    // Monitor but allow higher error rate
    'http_req_failed': ['rate<0.20'],  // Allow up to 20% failures

    // Track breaking point
    'breaking_point_vus': ['value>0'],  // Record when we break
  },

  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// =============================================================================
// Setup
// =============================================================================

export function setup() {
  console.log('='.repeat(60));
  console.log('STRESS TEST - FINDING THE BREAKING POINT');
  console.log('='.repeat(60));
  console.log(`Target API: ${__ENV.BASE_URL || 'http://localhost:8787'}`);
  console.log(`App ID: ${TEST_APP_ID}`);
  console.log('');
  console.log('Test phases (13 minutes total):');
  console.log('  0:00 - 1:00  : Warmup (0 -> 100 VUs)');
  console.log('  1:00 - 3:00  : Medium (100 -> 500 VUs)');
  console.log('  3:00 - 5:00  : High (500 -> 1000 VUs)');
  console.log('  5:00 - 8:00  : Very High (1000 -> 1500 VUs)');
  console.log('  8:00 - 10:00 : Extreme (1500 -> 2000 VUs)');
  console.log(' 10:00 - 12:00 : Sustain (2000 VUs)');
  console.log(' 12:00 - 13:00 : Ramp down');
  console.log('');

  // Health check
  const health = healthCheck();
  if (!health.success) {
    console.error('FATAL: API health check failed!');
    return { healthy: false };
  }

  console.log('Health check: PASSED');
  console.log('Starting stress test...');
  console.log('='.repeat(60));

  return {
    healthy: true,
    startTime: Date.now(),
  };
}

// =============================================================================
// Main Scenario
// =============================================================================

export default function stressTest(data) {
  if (!data.healthy) {
    sleep(1);
    return;
  }

  const currentVUs = __VU;
  const device = generateDevice();

  const startTime = Date.now();
  const result = updateCheck(device, null, TEST_APP_ID);
  const duration = Date.now() - startTime;

  // Track total requests
  totalCount++;

  if (!result.success) {
    errorCount++;
    vuLevelErrors.add(1);

    // Record first error VU count
    if (!firstErrorRecorded) {
      firstErrorRecorded = true;
      firstErrorVUs.add(currentVUs);
      console.log(`[FIRST ERROR] Occurred at ${currentVUs} VUs`);
    }

    // Check if we've hit breaking point (5% error rate)
    const currentErrorRate = errorCount / totalCount;
    if (!breakingPointRecorded && currentErrorRate > 0.05 && totalCount > 100) {
      breakingPointRecorded = true;
      breakingPointVUs.add(currentVUs);
      console.log(`[BREAKING POINT] 5% error rate reached at ${currentVUs} VUs`);
    }
  } else {
    vuLevelErrors.add(0);
    vuLevelSuccesses.add(1);
  }

  // Track high load response times (above 500 VUs)
  if (currentVUs > 500) {
    highLoadResponseTime.add(duration);
  }

  // Log progress periodically
  if (totalCount % 10000 === 0) {
    const errorRate = ((errorCount / totalCount) * 100).toFixed(2);
    console.log(`[Progress] Requests: ${totalCount}, Error Rate: ${errorRate}%, VUs: ${currentVUs}`);
  }

  // Aggressive pacing for stress test
  sleep(Math.random() * 0.3 + 0.1); // 0.1-0.4 seconds
}

// =============================================================================
// Teardown
// =============================================================================

export function teardown(data) {
  console.log('');
  console.log('='.repeat(60));
  console.log('STRESS TEST COMPLETE');
  console.log('='.repeat(60));

  if (!data.healthy) {
    console.log('Test was aborted');
    return;
  }

  const duration = ((Date.now() - data.startTime) / 1000).toFixed(1);
  const finalErrorRate = ((errorCount / totalCount) * 100).toFixed(2);

  console.log(`Duration: ${duration}s`);
  console.log(`Total Requests: ${totalCount}`);
  console.log(`Total Errors: ${errorCount}`);
  console.log(`Final Error Rate: ${finalErrorRate}%`);
  console.log('='.repeat(60));
}

// =============================================================================
// Custom Summary
// =============================================================================

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    testType: 'stress',
    appId: TEST_APP_ID,
    baseUrl: __ENV.BASE_URL || 'http://localhost:8787',

    // Key stress test findings
    findings: {
      maxVUsReached: 2000,
      firstErrorAtVUs: data.metrics.first_error_vus?.values?.value || 'No errors',
      breakingPointVUs: data.metrics.breaking_point_vus?.values?.value || 'Not reached',
    },

    metrics: {
      totalRequests: data.metrics.http_reqs?.values?.count || 0,
      successRate:
        ((1 - (data.metrics.http_req_failed?.values?.rate || 0)) * 100).toFixed(2) + '%',
      errorRate:
        ((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2) + '%',

      // Response times
      responseTime: {
        avg: data.metrics.update_check_duration?.values?.avg?.toFixed(2) + 'ms',
        p50: data.metrics.update_check_duration?.values?.['p(50)']?.toFixed(2) + 'ms',
        p95: data.metrics.update_check_duration?.values?.['p(95)']?.toFixed(2) + 'ms',
        p99: data.metrics.update_check_duration?.values?.['p(99)']?.toFixed(2) + 'ms',
        max: data.metrics.update_check_duration?.values?.max?.toFixed(2) + 'ms',
      },

      // High load specific
      highLoadResponseTime: {
        avg: data.metrics.high_load_response_time?.values?.avg?.toFixed(2) + 'ms',
        p95: data.metrics.high_load_response_time?.values?.['p(95)']?.toFixed(2) + 'ms',
        p99: data.metrics.high_load_response_time?.values?.['p(99)']?.toFixed(2) + 'ms',
      },
    },

    // Analysis
    analysis: {
      // Calculate capacity estimate (VUs at 1% error rate)
      estimatedCapacity:
        data.metrics.breaking_point_vus?.values?.value
          ? Math.floor(data.metrics.breaking_point_vus.values.value * 0.8)
          : 'Unknown (no breaking point reached)',

      // Degradation pattern
      degradation: {
        underNormalLoad:
          (data.metrics.update_check_duration?.values?.['p(95)'] || 0) < 500
            ? 'MINIMAL'
            : 'NOTICEABLE',
        underStress:
          (data.metrics.high_load_response_time?.values?.['p(95)'] || 0) < 2000
            ? 'ACCEPTABLE'
            : 'SIGNIFICANT',
      },

      // Recommendations
      recommendations: [],
    },

    thresholds: {},
  };

  // Add recommendations based on findings
  if (data.metrics.breaking_point_vus?.values?.value) {
    const bp = data.metrics.breaking_point_vus.values.value;
    if (bp < 500) {
      summary.analysis.recommendations.push(
        'CRITICAL: Breaking point is very low. Consider scaling infrastructure.'
      );
    } else if (bp < 1000) {
      summary.analysis.recommendations.push(
        'WARNING: Breaking point below 1000 VUs. Monitor closely during peak hours.'
      );
    }
  } else {
    summary.analysis.recommendations.push(
      'GOOD: No breaking point reached at 2000 VUs. System is well-provisioned.'
    );
  }

  const p99 = data.metrics.update_check_duration?.values?.['p(99)'] || 0;
  if (p99 > 5000) {
    summary.analysis.recommendations.push(
      'Consider adding caching or optimizing slow queries. p99 > 5s.'
    );
  }

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
    'results/stress-test-summary.json': JSON.stringify(summary, null, 2),
  };
}
