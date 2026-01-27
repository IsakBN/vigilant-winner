# BundleNudge Load Tests

k6-based load testing suite for the BundleNudge API.

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Test Scenarios

### 1. Load Test (Standard)

Tests normal production load patterns with ramping VUs.

```bash
# Run against local API
k6 run scenarios/index.js

# Run against staging
BASE_URL=https://api-staging.bundlenudge.com k6 run scenarios/index.js

# With custom app ID
APP_ID=your-app-uuid BASE_URL=https://api.bundlenudge.com k6 run scenarios/index.js
```

**Stages:**
- Ramp up: 0 -> 100 VUs over 1 minute
- Sustain: 100 VUs for 5 minutes
- Spike: 100 -> 500 VUs over 30 seconds
- Sustain spike: 500 VUs for 2 minutes
- Ramp down: 500 -> 0 over 1 minute

### 2. Soak Test (Endurance)

24-hour endurance test to detect memory leaks and degradation.

```bash
# Full 24-hour test
k6 run scenarios/soak.js

# Shorter version for CI
k6 run --duration 1h scenarios/soak.js
```

**Pattern:** 50 constant VUs for 24 hours

### 3. Spike Test

Tests sudden traffic spikes (viral app, push notification).

```bash
k6 run scenarios/spike.js
```

**Pattern:**
- Warmup: 10 VUs for 30s
- SPIKE: Instant jump to 1000 VUs
- Sustain: 1000 VUs for 2 minutes
- Recovery: Drop to 50 VUs

### 4. Stress Test

Finds the breaking point of the system.

```bash
k6 run scenarios/stress.js
```

**Pattern:** Gradual ramp from 0 to 2000 VUs over 10 minutes

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:8787` | API base URL |
| `APP_ID` | Test UUID | App ID to test against |

## Thresholds

All tests enforce these thresholds:

| Metric | Standard Load | Spike | Stress |
|--------|---------------|-------|--------|
| p95 Response Time | < 500ms | < 2s | < 5s |
| Error Rate | < 1% | < 5% | < 20% |
| p99 Response Time | < 1s | < 5s | - |

## Output

Tests output to both console and JSON files in `results/`:

- `results/load-test-summary.json`
- `results/soak-test-summary.json`
- `results/spike-test-summary.json`
- `results/stress-test-summary.json`

## Custom Metrics

| Metric | Description |
|--------|-------------|
| `update_check_duration` | Time to complete update check |
| `register_device_duration` | Time to register device |
| `successful_update_checks` | Count of successful checks |
| `updates_available` | Count of updates found |
| `failed_requests` | Rate of failed requests |
| `rate_limited_requests` | Count of 429 responses |

## Running in CI

```yaml
# GitHub Actions example
- name: Run load tests
  run: |
    brew install k6
    k6 run --duration 5m packages/e2e/load/scenarios/index.js
  env:
    BASE_URL: https://api-staging.bundlenudge.com
    APP_ID: ${{ secrets.TEST_APP_ID }}
```

## Integration with Grafana

For real-time visualization:

```bash
# Output to InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 scenarios/index.js

# Output to Prometheus
k6 run --out experimental-prometheus-rw scenarios/index.js
```

## Troubleshooting

**Rate limiting detected:**
The API has rate limits. If you see many 429s, reduce VU count or add delays.

**Connection errors:**
Check that the API is reachable and not behind a firewall.

**High error rate on spike:**
Normal for spike/stress tests. Check the breaking point metrics.
