/**
 * Jest Setup
 *
 * Global setup for Detox tests.
 */

import { beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals'
import { device } from 'detox'

/** Extend Jest timeout for device tests */
jest.setTimeout(120000)

beforeAll(async () => {
  await device.launchApp({ newInstance: true })
})

beforeEach(async () => {
  await device.reloadReactNative()
})

afterEach(async () => {
  // Take screenshot on failure (handled by Detox artifacts config)
})

afterAll(async () => {
  // Cleanup handled by Detox globalTeardown
})

/** Custom matcher for checking element visibility */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeVisibleWithTimeout(timeout?: number): Promise<R>
    }
  }
}
