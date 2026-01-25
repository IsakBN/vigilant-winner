# Feature: Edge Node Routing

## Agent ID: phase-14-edge-nodes

## Overview
Route bundle downloads to nearest edge location for faster delivery.

## Reference
See legacy: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/nodes.ts`

## Requirements

1. **Edge Discovery**
   - GET `/api/sdk/edge`
   - Return nearest edge URL based on client IP
   - Support geo-routing

2. **Node Health**
   - Health checks for edge nodes
   - Failover to next-nearest
   - Latency-based routing

3. **Cloudflare Integration**
   - Use Cloudflare's global network
   - R2 with regional buckets
   - Smart routing

4. **Metrics**
   - Track download times by region
   - Monitor edge node health
   - Optimize routing decisions

## Files to Create
- `packages/api/src/routes/sdk/edge.ts`
- `packages/api/src/routes/sdk/edge.test.ts`
- `packages/api/src/lib/edge-router.ts`
- `packages/api/src/lib/edge-router.test.ts`

## Tests Required
- Geo-routing logic
- Failover behavior
- Health check handling
- Latency optimization
