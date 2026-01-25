# Feature: Advanced Metrics

## Agent ID: phase-13-metrics-advanced

## Overview
Advanced metrics collection and aggregation for apps.

## Reference
See legacy: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/metrics.ts`

## Requirements

1. **Metrics Endpoints**
   - GET `/api/apps/:appId/metrics`
   - GET `/api/apps/:appId/metrics/realtime`
   - GET `/api/admin/metrics/global`

2. **Metrics Collected**
   - Update success/failure rates
   - Download speeds by region
   - Active devices by version
   - Rollback frequency
   - Bundle download times

3. **Aggregation**
   - Hourly/daily/weekly rollups
   - Regional breakdown
   - Version comparison

4. **Storage**
   - Use D1 for aggregated data
   - Use KV for realtime counters
   - Prune old detailed data

## Files to Create
- `packages/api/src/routes/metrics/index.ts`
- `packages/api/src/routes/metrics/index.test.ts`
- `packages/api/src/lib/metrics-aggregator.ts`
- `packages/api/src/lib/metrics-aggregator.test.ts`

## Tests Required
- Metric recording
- Aggregation accuracy
- Query performance
- Data pruning
