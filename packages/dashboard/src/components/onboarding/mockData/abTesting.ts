/**
 * Mock A/B testing data for onboarding previews
 */

const now = Date.now()
const day = 24 * 60 * 60 * 1000

// Mock A/B test experiments
export interface MockABTest {
  id: string
  version: string
  channel: string
  status: 'rolling' | 'complete'
  createdAt: number
  variantCount: number
  variants: MockVariant[]
}

export interface MockVariant {
  id: string
  name: string
  percentage: number
  isControl: boolean
  deviceCount: number
  conversionRate: number
  avgSessionTime: number
}

export const mockABTests: MockABTest[] = [
  {
    id: 'mock-test-1',
    version: '2.5.0',
    channel: 'production',
    status: 'rolling',
    createdAt: now - 3 * day,
    variantCount: 2,
    variants: [
      {
        id: 'var-1a',
        name: 'Control',
        percentage: 50,
        isControl: true,
        deviceCount: 12450,
        conversionRate: 4.2,
        avgSessionTime: 185, // seconds
      },
      {
        id: 'var-1b',
        name: 'New Checkout Flow',
        percentage: 50,
        isControl: false,
        deviceCount: 12380,
        conversionRate: 5.8,
        avgSessionTime: 210,
      },
    ],
  },
  {
    id: 'mock-test-2',
    version: '2.4.0',
    channel: 'production',
    status: 'complete',
    createdAt: now - 14 * day,
    variantCount: 3,
    variants: [
      {
        id: 'var-2a',
        name: 'Control',
        percentage: 33,
        isControl: true,
        deviceCount: 8200,
        conversionRate: 3.1,
        avgSessionTime: 165,
      },
      {
        id: 'var-2b',
        name: 'Dark Theme',
        percentage: 33,
        isControl: false,
        deviceCount: 8150,
        conversionRate: 3.4,
        avgSessionTime: 178,
      },
      {
        id: 'var-2c',
        name: 'Simplified Nav',
        percentage: 34,
        isControl: false,
        deviceCount: 8350,
        conversionRate: 4.1,
        avgSessionTime: 195,
      },
    ],
  },
]

// A/B Testing stats for preview
export const mockABTestStats = {
  activeTests: 1,
  completedTests: 1,
  totalVariants: 5,
  avgLift: '+23%', // average improvement over control
}
