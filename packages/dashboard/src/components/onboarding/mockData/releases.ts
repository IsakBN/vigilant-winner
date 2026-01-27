/**
 * Mock release data for onboarding previews
 */

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export interface MockRelease {
  id: string
  app_id: string
  version: string
  channel: string
  bundle_key: string
  bundle_size: number
  bundle_hash: string
  rollout_percentage: number
  status: 'rolling' | 'complete' | 'paused' | 'failed' | 'pending' | 'rolled_back'
  commit_sha?: string
  commit_message?: string
  created_at: number
}

export const mockReleases: MockRelease[] = [
  {
    id: 'mock-release-1',
    app_id: 'mock-app',
    version: '1.4.2',
    channel: 'production',
    bundle_key: 'bundles/mock-1',
    bundle_size: 2_847_520,
    bundle_hash: 'a1b2c3d4e5f6',
    rollout_percentage: 100,
    status: 'complete',
    commit_sha: 'f8a2b1c',
    commit_message: 'fix: resolve checkout flow crash on iOS 17',
    created_at: now - 1 * day,
  },
  {
    id: 'mock-release-2',
    app_id: 'mock-app',
    version: '1.4.1',
    channel: 'production',
    bundle_key: 'bundles/mock-2',
    bundle_size: 2_821_440,
    bundle_hash: 'b2c3d4e5f6a1',
    rollout_percentage: 50,
    status: 'rolling',
    commit_sha: 'e7d1a3f',
    commit_message: 'feat: add dark mode support',
    created_at: now - 3 * day,
  },
  {
    id: 'mock-release-3',
    app_id: 'mock-app',
    version: '1.4.0',
    channel: 'production',
    bundle_key: 'bundles/mock-3',
    bundle_size: 2_789_120,
    bundle_hash: 'c3d4e5f6a1b2',
    rollout_percentage: 100,
    status: 'complete',
    commit_sha: 'd6c0b2e',
    commit_message: 'feat: redesigned home screen',
    created_at: now - 7 * day,
  },
  {
    id: 'mock-release-4',
    app_id: 'mock-app',
    version: '1.3.8',
    channel: 'production',
    bundle_key: 'bundles/mock-4',
    bundle_size: 2_654_080,
    bundle_hash: 'd4e5f6a1b2c3',
    rollout_percentage: 100,
    status: 'complete',
    commit_sha: 'a5b9c1d',
    commit_message: 'fix: memory leak in image gallery',
    created_at: now - 14 * day,
  },
]

// Mock stats for rollout visualization
export const mockReleaseStats: Record<string, {
  downloads: number
  applied: number
  errors: number
  rollbacks: number
}> = {
  'mock-release-1': {
    downloads: 12_453,
    applied: 12_381,
    errors: 3,
    rollbacks: 0,
  },
  'mock-release-2': {
    downloads: 6_842,
    applied: 6_791,
    errors: 2,
    rollbacks: 1,
  },
}
