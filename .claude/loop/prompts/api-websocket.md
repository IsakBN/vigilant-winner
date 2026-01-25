# Feature: WebSocket Support

## Agent ID: phase-14-websocket

## Overview
Real-time communication via WebSocket for live updates.

## Reference
See legacy: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/ws.ts`

## Requirements

1. **WebSocket Endpoint**
   - WS `/api/ws`
   - Authenticate via token in query
   - Support Cloudflare Durable Objects

2. **Event Types**
   - `release.published` - New release available
   - `rollback.triggered` - Rollback happened
   - `metrics.update` - Live metrics
   - `build.status` - Build progress

3. **Subscriptions**
   - Subscribe to app events
   - Subscribe to team events
   - Unsubscribe support

4. **Implementation**
   - Use Cloudflare Durable Objects
   - Room-based pub/sub
   - Heartbeat/ping-pong

## Files to Create
- `packages/api/src/routes/ws/index.ts`
- `packages/api/src/routes/ws/index.test.ts`
- `packages/api/src/lib/websocket-manager.ts`
- `packages/api/src/durable-objects/websocket-room.ts`

## Tests Required
- Connection lifecycle
- Authentication
- Event broadcasting
- Subscription management
