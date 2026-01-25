# Feature: dashboard/api-client

Implement the API client with all modules.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → All endpoints
- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → API client structure

## Dependencies

- `dashboard/scaffold` (must complete first)

## What to Implement

### 1. Base Client

```typescript
// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export class ApiError extends Error {
  status: number
  code?: string
  details?: string

  constructor(message: string, status: number, code?: string, details?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(
      body.message || `API error: ${response.status}`,
      response.status,
      body.error,
      body.details
    )
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint)
}

export function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export function apiPatch<T>(endpoint: string, data: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'DELETE',
  })
}
```

### 2. Auth Module

```typescript
// lib/api/auth.ts
import { apiPost, apiGet } from './client'

export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
}

export interface Session {
  user: User
  expiresAt: string
}

export const authApi = {
  signIn: (data: { email: string; password: string }) =>
    apiPost<{ user: User }>('/auth/sign-in/email', data),

  signUp: (data: { name: string; email: string; password: string }) =>
    apiPost<{ user: User }>('/auth/sign-up/email', data),

  signOut: () =>
    apiPost<void>('/auth/sign-out'),

  getSession: () =>
    apiGet<Session>('/auth/session'),

  verifyEmail: (data: { email: string; otp: string }) =>
    apiPost<{ user: User }>('/auth/verify-email', data),

  resendVerification: (data: { email: string }) =>
    apiPost<void>('/auth/resend-verification', data),

  forgotPassword: (data: { email: string }) =>
    apiPost<void>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string }) =>
    apiPost<void>('/auth/reset-password', data),
}
```

### 3. Apps Module

```typescript
// lib/api/apps.ts
import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export interface App {
  id: string
  name: string
  platform: 'ios' | 'android' | 'both'
  bundleId?: string
  apiKey: string
  createdAt: string
  updatedAt: string
  releaseCount?: number
  deviceCount?: number
}

export const appsApi = {
  list: () =>
    apiGet<{ apps: App[] }>('/apps'),

  get: (appId: string) =>
    apiGet<{ app: App }>(`/apps/${appId}`),

  create: (data: { name: string; platform: string; bundleId?: string }) =>
    apiPost<{ app: App }>('/apps', data),

  update: (appId: string, data: { name?: string; bundleId?: string }) =>
    apiPatch<{ app: App }>(`/apps/${appId}`, data),

  delete: (appId: string) =>
    apiDelete<void>(`/apps/${appId}`),

  regenerateKey: (appId: string) =>
    apiPost<{ apiKey: string }>(`/apps/${appId}/regenerate-key`),

  getStats: (appId: string, period?: '24h' | '7d' | '30d') =>
    apiGet<{ stats: unknown[]; mau: number }>(`/apps/${appId}/stats?period=${period || '7d'}`),
}
```

### 4. Releases Module

```typescript
// lib/api/releases.ts
import { apiGet, apiPost, apiPatch } from './client'

export interface Release {
  id: string
  appId: string
  version: string
  channel: 'production' | 'staging' | 'development'
  description?: string
  bundleUrl?: string
  bundleHash?: string
  bundleSize?: number
  rolloutPercentage: number
  isMandatory: boolean
  isDisabled: boolean
  createdAt: string
  downloads?: number
  installs?: number
  rollbacks?: number
}

export const releasesApi = {
  list: (appId: string) =>
    apiGet<{ releases: Release[] }>(`/apps/${appId}/releases`),

  get: (appId: string, releaseId: string) =>
    apiGet<{ release: Release }>(`/apps/${appId}/releases/${releaseId}`),

  create: (appId: string, data: {
    version: string
    channel?: string
    description?: string
    rolloutPercentage?: number
    isMandatory?: boolean
  }) =>
    apiPost<{ release: Release }>(`/apps/${appId}/releases`, data),

  updateRollout: (appId: string, releaseId: string, percentage: number) =>
    apiPatch<{ release: Release }>(`/apps/${appId}/releases/${releaseId}/rollout`, {
      rolloutPercentage: percentage,
    }),

  disable: (appId: string, releaseId: string) =>
    apiPost<{ release: Release }>(`/apps/${appId}/releases/${releaseId}/disable`),
}
```

### 5. Teams Module

```typescript
// lib/api/teams.ts
import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export interface Team {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member'
  memberCount: number
  createdAt: string
}

export interface TeamMember {
  id: string
  userId: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
}

export interface TeamInvitation {
  id: string
  email: string
  role: 'admin' | 'member'
  status: 'pending' | 'accepted' | 'expired'
  createdAt: string
  expiresAt: string
}

export const teamsApi = {
  list: () =>
    apiGet<{ teams: Team[] }>('/teams'),

  get: (teamId: string) =>
    apiGet<{ team: Team }>(`/teams/${teamId}`),

  create: (data: { name: string }) =>
    apiPost<{ team: Team }>('/teams', data),

  update: (teamId: string, data: { name: string }) =>
    apiPatch<{ team: Team }>(`/teams/${teamId}`, data),

  delete: (teamId: string) =>
    apiDelete<void>(`/teams/${teamId}`),

  listMembers: (teamId: string) =>
    apiGet<{ members: TeamMember[] }>(`/teams/${teamId}/members`),

  inviteMember: (teamId: string, data: { email: string; role: string }) =>
    apiPost<void>(`/teams/${teamId}/invitations`, data),

  listInvitations: (teamId: string) =>
    apiGet<{ invitations: TeamInvitation[] }>(`/teams/${teamId}/invitations`),

  cancelInvitation: (teamId: string, invitationId: string) =>
    apiDelete<void>(`/teams/${teamId}/invitations/${invitationId}`),

  updateMemberRole: (teamId: string, memberId: string, role: string) =>
    apiPatch<void>(`/teams/${teamId}/members/${memberId}`, { role }),

  removeMember: (teamId: string, memberId: string) =>
    apiDelete<void>(`/teams/${teamId}/members/${memberId}`),

  verifyInvitation: (data: { teamId: string; email: string; otp: string }) =>
    apiPost<{ team: Team }>('/teams/verify-invitation', data),
}
```

### 6. Subscriptions Module

```typescript
// lib/api/subscriptions.ts
import { apiGet, apiPost } from './client'

export interface Subscription {
  id: string
  planId: 'free' | 'pro' | 'team' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due'
  currentPeriodEnd: string
}

export interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  limits: {
    mau: number
    storage: number
    apps: number
    teamMembers: number
  }
}

export interface Usage {
  mau: number
  storage: number
  apps: number
  teamMembers: number
}

export const subscriptionsApi = {
  getCurrent: () =>
    apiGet<{ subscription: Subscription }>('/subscriptions/current'),

  getPlans: () =>
    apiGet<{ plans: Plan[] }>('/subscriptions/plans'),

  getUsage: () =>
    apiGet<{ usage: Usage }>('/subscriptions/usage'),

  createCheckout: (planId: string) =>
    apiPost<{ url: string }>('/subscriptions/checkout', {
      planId,
      successUrl: `${window.location.origin}/dashboard?checkout=success`,
      cancelUrl: `${window.location.origin}/dashboard/billing?checkout=cancelled`,
    }),

  createPortal: () =>
    apiPost<{ url: string }>('/subscriptions/portal'),
}
```

### 7. API Export

```typescript
// lib/api/index.ts
import { authApi } from './auth'
import { appsApi } from './apps'
import { releasesApi } from './releases'
import { teamsApi } from './teams'
import { subscriptionsApi } from './subscriptions'

export const api = {
  auth: authApi,
  apps: appsApi,
  releases: releasesApi,
  teams: teamsApi,
  subscriptions: subscriptionsApi,
}

export * from './client'
export * from './auth'
export * from './apps'
export * from './releases'
export * from './teams'
export * from './subscriptions'
```

## Files to Create

1. `lib/api/client.ts`
2. `lib/api/auth.ts`
3. `lib/api/apps.ts`
4. `lib/api/releases.ts`
5. `lib/api/teams.ts`
6. `lib/api/subscriptions.ts`
7. `lib/api/webhooks.ts`
8. `lib/api/devices.ts`
9. `lib/api/admin.ts`
10. `lib/api/index.ts`

## Tests Required

```typescript
// lib/api/__tests__/client.test.ts
describe('apiClient', () => {
  it('handles successful responses', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }))
    const result = await apiFetch('/test')
    expect(result).toEqual({ data: 'test' })
  })

  it('throws ApiError on error response', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'NOT_FOUND', message: 'Not found' }), { status: 404 })
    await expect(apiFetch('/test')).rejects.toThrow(ApiError)
  })

  it('includes credentials', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({}))
    await apiFetch('/test')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' })
    )
  })
})
```

## Acceptance Criteria

- [ ] Base client with error handling
- [ ] ApiError class with status, code, details
- [ ] Auth module (sign in, sign up, verify, etc.)
- [ ] Apps module (CRUD, stats)
- [ ] Releases module (CRUD, rollout)
- [ ] Teams module (CRUD, members, invitations)
- [ ] Subscriptions module (checkout, portal)
- [ ] All methods typed
- [ ] Tests pass
