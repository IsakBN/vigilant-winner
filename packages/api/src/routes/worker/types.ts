/**
 * Worker route types
 * @agent queue-system
 */

export interface ClaimedBuild {
  id: string
  type: 'ios' | 'android'
  appId: string
  // iOS fields
  version?: string
  buildNumber?: number
  configuration?: 'debug' | 'release'
  bundleId?: string
  teamId?: string | null
  // Android fields
  versionCode?: number
  buildType?: string
  flavor?: string | null
  packageName?: string
  keystoreAlias?: string | null
}

export interface ClaimResponse {
  claimed: boolean
  build: ClaimedBuild | null
}
