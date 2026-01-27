# BundleNudge API Reference

Base URL: `https://api.bundlenudge.com/v1`

## Authentication

All requests require an API key in the header:

```
Authorization: Bearer bnk_your_api_key
```

API keys are created in the dashboard under App Settings > API Keys.

## Endpoints

### Check for Updates

```
POST /updates/check
```

The SDK calls this to check if an update is available.

**Request:**
```json
{
  "appId": "app_abc123",
  "platform": "ios",
  "bundleId": "bundle_current",
  "appVersion": "1.0.0",
  "channel": "production",
  "deviceId": "device_xyz"
}
```

**Response (update available):**
```json
{
  "updateAvailable": true,
  "release": {
    "id": "rel_xyz",
    "version": "1.2.0",
    "bundleUrl": "https://cdn.bundlenudge.com/bundles/...",
    "size": 1024000,
    "hash": "sha256:abc123...",
    "releaseNotes": "Bug fixes and improvements",
    "mandatory": false
  }
}
```

**Response (no update):**
```json
{
  "updateAvailable": false
}
```

### Report Telemetry

```
POST /telemetry
```

Report update events for analytics.

**Request:**
```json
{
  "appId": "app_abc123",
  "deviceId": "device_xyz",
  "event": "update_applied",
  "releaseId": "rel_xyz",
  "metadata": {
    "downloadTime": 1234,
    "applyTime": 567
  }
}
```

### List Apps

```
GET /apps
```

List all apps for the authenticated account.

**Response:**
```json
{
  "apps": [
    {
      "id": "app_abc123",
      "name": "My App",
      "platform": "ios",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create App

```
POST /apps
```

**Request:**
```json
{
  "name": "My New App",
  "platform": "ios"
}
```

**Response:**
```json
{
  "id": "app_abc123",
  "name": "My New App",
  "platform": "ios",
  "apiKey": "bnk_generated_key",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### List Releases

```
GET /apps/:appId/releases
```

**Query Parameters:**
- `channel` - Filter by channel (optional)
- `limit` - Max results (default: 20)
- `cursor` - Pagination cursor

**Response:**
```json
{
  "releases": [
    {
      "id": "rel_xyz",
      "version": "1.2.0",
      "channel": "production",
      "status": "active",
      "rolloutPercentage": 100,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "nextCursor": "cursor_abc"
}
```

### Create Release

```
POST /apps/:appId/releases
```

**Request (multipart/form-data):**
```
bundle: [binary file]
version: 1.2.0
channel: production
releaseNotes: Bug fixes
targetBinaryVersion: >=1.0.0
```

**Response:**
```json
{
  "id": "rel_xyz",
  "version": "1.2.0",
  "channel": "production",
  "status": "processing",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Rollback Release

```
POST /apps/:appId/releases/:releaseId/rollback
```

Rolls back to the previous release.

**Response:**
```json
{
  "success": true,
  "previousRelease": "rel_abc",
  "rolledBackRelease": "rel_xyz"
}
```

### List Channels

```
GET /apps/:appId/channels
```

**Response:**
```json
{
  "channels": [
    {
      "name": "production",
      "activeRelease": "rel_xyz",
      "deviceCount": 1500
    },
    {
      "name": "beta",
      "activeRelease": "rel_abc",
      "deviceCount": 50
    }
  ]
}
```

### Update Channel

```
PATCH /apps/:appId/channels/:channelName
```

**Request:**
```json
{
  "activeRelease": "rel_xyz",
  "rolloutPercentage": 50
}
```

### Get Release Metrics

```
GET /apps/:appId/releases/:releaseId/metrics
```

**Response:**
```json
{
  "releaseId": "rel_xyz",
  "downloads": 1234,
  "installs": 1100,
  "rollbacks": 5,
  "errors": 2,
  "avgDownloadTime": 1500,
  "avgApplyTime": 200
}
```

## Webhooks

Configure webhooks in the dashboard to receive events.

### Events

| Event | Description |
|-------|-------------|
| `release.created` | New release uploaded |
| `release.activated` | Release went live |
| `release.rollback` | Release was rolled back |
| `device.updated` | Device received update |
| `error.occurred` | Error during update |

### Payload Format

```json
{
  "event": "release.activated",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "releaseId": "rel_xyz",
    "appId": "app_abc123",
    "version": "1.2.0",
    "channel": "production"
  }
}
```

### Webhook Signature

Verify webhooks using the signature header:

```
X-BundleNudge-Signature: sha256=abc123...
```

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: appId"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | API key lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INVALID_REQUEST` | 400 | Malformed request |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/updates/check` | 1000/min per app |
| `/telemetry` | 5000/min per app |
| All others | 100/min per API key |

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705320000
```
