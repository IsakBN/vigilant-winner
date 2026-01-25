# Feature: Bundle Size Optimization

## Agent ID: phase-13-bundle-size

## Overview
Implement bundle size analysis and optimization for uploaded bundles.

## Reference
See legacy: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/bundle-size.ts`

## Requirements

1. **Bundle Analysis Endpoint**
   - POST `/api/bundles/:id/analyze`
   - Parse bundle, identify chunks
   - Calculate sizes (raw, gzipped, brotli)
   - Detect duplicate modules

2. **Size Optimization**
   - Chunk splitting recommendations
   - Tree-shaking analysis
   - Duplicate detection across releases

3. **Size Limits**
   - Configurable per-app limits
   - Warn on threshold exceeded
   - Block releases over hard limit

4. **Database Schema**
   - `bundle_analysis` table
   - `chunk_info` table
   - Store historical size data

## Files to Create
- `packages/api/src/routes/bundles/size.ts`
- `packages/api/src/routes/bundles/size.test.ts`
- `packages/api/src/lib/bundle-analyzer.ts`
- `packages/api/src/lib/bundle-analyzer.test.ts`

## Tests Required
- Bundle parsing
- Size calculation
- Duplicate detection
- Limit enforcement
