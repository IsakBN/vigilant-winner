/**
 * Mock audience data for onboarding previews
 * Combines testers and registered devices for the Audience tab
 */

const now = Date.now()
const day = 24 * 60 * 60 * 1000

// Mock testers for preview
export interface MockTester {
  id: string
  appId: string
  email: string
  name: string
  createdAt: number
  stats?: {
    totalSent: number
    totalOpened: number
    totalClicked: number
    lastSentAt: number
  }
}

export const mockAudienceTesters: MockTester[] = [
  {
    id: 'mock-tester-1',
    appId: 'mock-app',
    email: 'sarah.chen@example.com',
    name: 'Sarah Chen',
    createdAt: now - 30 * day,
    stats: {
      totalSent: 15,
      totalOpened: 14,
      totalClicked: 12,
      lastSentAt: now - 2 * day,
    },
  },
  {
    id: 'mock-tester-2',
    appId: 'mock-app',
    email: 'mike.johnson@example.com',
    name: 'Mike Johnson',
    createdAt: now - 25 * day,
    stats: {
      totalSent: 12,
      totalOpened: 10,
      totalClicked: 8,
      lastSentAt: now - 2 * day,
    },
  },
  {
    id: 'mock-tester-3',
    appId: 'mock-app',
    email: 'qa-team@example.com',
    name: 'QA Team',
    createdAt: now - 45 * day,
    stats: {
      totalSent: 42,
      totalOpened: 41,
      totalClicked: 38,
      lastSentAt: now - 1 * day,
    },
  },
]

// Mock registered devices for preview
export interface MockRegisteredDevice {
  id: string
  device_id: string
  platform: 'ios' | 'android'
  bundle_id: string
  last_seen_at: number
  revoked: boolean
  fingerprint?: {
    model?: string
  }
}

export const mockRegisteredDevices: MockRegisteredDevice[] = [
  {
    id: 'mock-reg-1',
    device_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    platform: 'ios',
    bundle_id: 'com.example.myapp',
    last_seen_at: now - 5 * 60 * 1000, // 5 mins ago
    revoked: false,
    fingerprint: { model: 'iPhone 15 Pro' },
  },
  {
    id: 'mock-reg-2',
    device_id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    platform: 'android',
    bundle_id: 'com.example.myapp',
    last_seen_at: now - 2 * 60 * 60 * 1000, // 2 hours ago
    revoked: false,
    fingerprint: { model: 'Pixel 8 Pro' },
  },
  {
    id: 'mock-reg-3',
    device_id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    platform: 'ios',
    bundle_id: 'com.example.myapp',
    last_seen_at: now - 1 * day,
    revoked: false,
    fingerprint: { model: 'iPad Pro' },
  },
  {
    id: 'mock-reg-4',
    device_id: 'd4e5f6a7-b8c9-0123-defa-456789012345',
    platform: 'android',
    bundle_id: 'com.example.myapp',
    last_seen_at: now - 3 * day,
    revoked: true,
    fingerprint: { model: 'Samsung Galaxy S24' },
  },
]

// Audience stats
export const mockAudienceStats = {
  testers: {
    total: 3,
    emailsSent: 69,
    emailsOpened: 65,
  },
  devices: {
    total: 4,
    active: 3,
    revoked: 1,
    ios: 2,
    android: 2,
  },
}
