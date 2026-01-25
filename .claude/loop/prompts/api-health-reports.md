# Feature: Device Health Reports

## Agent ID: phase-13-health-reports

## Overview
Receive and process health/crash reports from SDK.

## Requirements

1. **Report Endpoint**
   - POST `/api/sdk/health-report`
   - Accept crash reports from devices
   - Correlate with bundle version

2. **Report Types**
   - JS errors with stack traces
   - Native crashes
   - Performance metrics
   - Memory warnings
   - ANR (App Not Responding)

3. **Processing**
   - Symbolicate stack traces
   - Group similar errors
   - Calculate error rates per release
   - Trigger auto-rollback if threshold

4. **Integration**
   - Forward to Sentry/Bugsnag
   - Include in release metrics
   - Webhook notifications

## Files to Create
- `packages/api/src/routes/sdk/health.ts`
- `packages/api/src/routes/sdk/health.test.ts`
- `packages/api/src/lib/health-processor.ts`
- `packages/api/src/lib/health-processor.test.ts`

## Tests Required
- Report ingestion
- Stack trace parsing
- Error grouping
- Auto-rollback trigger
