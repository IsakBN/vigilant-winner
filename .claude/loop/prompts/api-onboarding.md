# Feature: Onboarding Flow

## Agent ID: phase-14-onboarding

## Overview
First-time user setup wizard and guided experience.

## Requirements

1. **Onboarding State**
   - Track onboarding progress per user
   - Steps: account → app → sdk → first-release
   - Skip/resume support

2. **Endpoints**
   - GET `/api/user/onboarding`
   - PATCH `/api/user/onboarding`
   - POST `/api/user/onboarding/complete`

3. **Guided Steps**
   - Create first app
   - Install SDK (show code snippets)
   - Upload first bundle
   - Verify device connection

4. **Helpers**
   - Generate sample app config
   - Provide SDK install commands
   - Show verification status

## Files to Create
- `packages/api/src/routes/user/onboarding.ts`
- `packages/api/src/routes/user/onboarding.test.ts`
- `packages/api/src/lib/onboarding-helper.ts`
- `packages/api/src/lib/onboarding-helper.test.ts`

## Tests Required
- State tracking
- Step progression
- Skip/resume
- Completion triggers
