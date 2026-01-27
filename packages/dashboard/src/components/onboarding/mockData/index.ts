/**
 * Mock data for onboarding previews
 *
 * These exports provide realistic sample data for demonstrating
 * what each dashboard tab looks like when populated.
 */

export { mockReleases, mockReleaseStats } from './releases'
export type { MockRelease } from './releases'

export {
  mockAudienceTesters,
  mockRegisteredDevices,
  mockAudienceStats,
} from './audience'
export type { MockTester, MockRegisteredDevice } from './audience'

export { mockABTests, mockABTestStats } from './abTesting'
export type { MockABTest, MockVariant } from './abTesting'
