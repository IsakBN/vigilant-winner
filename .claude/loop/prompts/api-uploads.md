# Feature: Direct Bundle Uploads

## Agent ID: phase-13-uploads

## Overview
Direct upload endpoint for JS bundles (bypassing build system).

## Requirements

1. **Upload Endpoint**
   - POST `/api/apps/:appId/bundles/upload`
   - Accept multipart form data
   - Validate bundle structure
   - Store in R2

2. **Bundle Validation**
   - Check for valid JS bundle
   - Verify source maps if provided
   - Check bundle size limits

3. **Processing Pipeline**
   - Generate bundle hash
   - Create release record
   - Trigger size analysis
   - Notify via webhook

4. **Resume Support**
   - Support chunked uploads for large bundles
   - Track upload progress
   - Allow resume on failure

## Files to Create
- `packages/api/src/routes/bundles/upload.ts`
- `packages/api/src/routes/bundles/upload.test.ts`
- `packages/api/src/lib/upload-handler.ts`
- `packages/api/src/lib/upload-handler.test.ts`

## Tests Required
- Valid bundle upload
- Invalid bundle rejection
- Size limit enforcement
- Chunked upload resume
