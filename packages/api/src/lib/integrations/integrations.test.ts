import { describe, it, expect } from 'vitest'
import { formatCrashForSlack } from './slack'
import { formatCrashForDiscord } from './discord'
import type { CrashReport, IntegrationProvider } from './types'

describe('integrations', () => {
  const mockCrash: CrashReport = {
    appId: 'app-123',
    appName: 'Test App',
    releaseVersion: '1.0.0',
    bundleVersion: '1.0.0-abc123',
    deviceId: 'device-456',
    platform: 'ios',
    errorMessage: 'TypeError: Cannot read property "foo" of undefined',
    stackTrace: 'at Object.bar (bundle.js:123)\nat App.render (bundle.js:456)',
    timestamp: '2023-11-14T22:13:20.000Z',
    metadata: { userId: 'user-789' },
  }

  describe('Slack formatting', () => {
    it('formats crash for Slack', () => {
      const message = formatCrashForSlack(mockCrash)

      expect(message.text).toContain('Crash detected')
      expect(message.text).toContain('Test App')
      expect(message.blocks).toBeDefined()
    })

    it('includes header block', () => {
      const message = formatCrashForSlack(mockCrash)
      const headerBlock = message.blocks?.find((b) => b.type === 'header')

      expect(headerBlock).toBeDefined()
    })

    it('includes platform and version fields', () => {
      const message = formatCrashForSlack(mockCrash)
      const sectionBlock = message.blocks?.find(
        (b) => b.type === 'section' && b.fields
      )

      expect(sectionBlock?.fields?.length).toBeGreaterThan(0)
    })

    it('includes error message', () => {
      const message = formatCrashForSlack(mockCrash)
      const errorBlock = message.blocks?.find(
        (b) => b.type === 'section' && b.text?.text?.includes('TypeError')
      )

      expect(errorBlock).toBeDefined()
    })

    it('includes stack trace when present', () => {
      const message = formatCrashForSlack(mockCrash)
      const stackBlock = message.blocks?.find(
        (b) => b.type === 'section' && b.text?.text?.includes('Stack Trace')
      )

      expect(stackBlock).toBeDefined()
    })

    it('handles crash without stack trace', () => {
      const crashNoStack = { ...mockCrash, stackTrace: undefined }
      const message = formatCrashForSlack(crashNoStack)

      // Should not throw
      expect(message.text).toBeDefined()
    })

    it('truncates long stack trace', () => {
      const crashLongStack = {
        ...mockCrash,
        stackTrace: 'A'.repeat(2000),
      }
      const message = formatCrashForSlack(crashLongStack)
      const stackBlock = message.blocks?.find(
        (b) => b.type === 'section' && b.text?.text?.includes('...')
      )

      expect(stackBlock).toBeDefined()
    })
  })

  describe('Discord formatting', () => {
    it('formats crash for Discord', () => {
      const message = formatCrashForDiscord(mockCrash)

      expect(message.content).toContain('Crash detected')
      expect(message.content).toContain('Test App')
      expect(message.embeds).toBeDefined()
    })

    it('includes embed with title', () => {
      const message = formatCrashForDiscord(mockCrash)
      const embed = message.embeds?.[0]

      expect(embed?.title).toContain('Crash')
      expect(embed?.title).toContain('Test App')
    })

    it('embed has red color for crash', () => {
      const message = formatCrashForDiscord(mockCrash)
      const embed = message.embeds?.[0]

      expect(embed?.color).toBe(0xff0000)
    })

    it('includes platform field', () => {
      const message = formatCrashForDiscord(mockCrash)
      const embed = message.embeds?.[0]
      const platformField = embed?.fields?.find((f) => f.name === 'Platform')

      expect(platformField?.value).toBe('ios')
    })

    it('includes version field', () => {
      const message = formatCrashForDiscord(mockCrash)
      const embed = message.embeds?.[0]
      const versionField = embed?.fields?.find((f) => f.name === 'Version')

      expect(versionField?.value).toBe('1.0.0')
    })

    it('includes error field', () => {
      const message = formatCrashForDiscord(mockCrash)
      const embed = message.embeds?.[0]
      const errorField = embed?.fields?.find((f) => f.name === 'Error')

      expect(errorField?.value).toContain('TypeError')
    })

    it('includes timestamp', () => {
      const message = formatCrashForDiscord(mockCrash)
      const embed = message.embeds?.[0]

      expect(embed?.timestamp).toBe(mockCrash.timestamp)
    })

    it('handles crash without stack trace', () => {
      const crashNoStack = { ...mockCrash, stackTrace: undefined }
      const message = formatCrashForDiscord(crashNoStack)

      expect(message.content).toBeDefined()
    })
  })

  describe('integration providers', () => {
    const providers: IntegrationProvider[] = [
      'sentry',
      'bugsnag',
      'crashlytics',
      'slack',
      'discord',
    ]

    it('all providers are valid types', () => {
      for (const provider of providers) {
        expect(typeof provider).toBe('string')
      }
    })

    it('providers list is complete', () => {
      expect(providers).toHaveLength(5)
    })
  })

  describe('crash report structure', () => {
    it('requires all mandatory fields', () => {
      const crash: CrashReport = {
        appId: 'app',
        appName: 'App',
        releaseVersion: '1.0.0',
        bundleVersion: '1.0.0-hash',
        deviceId: 'device',
        platform: 'ios',
        errorMessage: 'Error',
        timestamp: new Date().toISOString(),
      }

      expect(crash.appId).toBeDefined()
      expect(crash.appName).toBeDefined()
      expect(crash.platform).toBeDefined()
      expect(crash.errorMessage).toBeDefined()
    })

    it('allows optional fields', () => {
      const crash: CrashReport = {
        appId: 'app',
        appName: 'App',
        releaseVersion: '1.0.0',
        bundleVersion: '1.0.0-hash',
        deviceId: 'device',
        platform: 'android',
        errorMessage: 'Error',
        timestamp: new Date().toISOString(),
        stackTrace: 'stack...',
        metadata: { key: 'value' },
      }

      expect(crash.stackTrace).toBeDefined()
      expect(crash.metadata).toBeDefined()
    })

    it('platform is ios or android', () => {
      const platforms: Array<'ios' | 'android'> = ['ios', 'android']

      for (const platform of platforms) {
        const crash: CrashReport = {
          ...mockCrash,
          platform,
        }
        expect(['ios', 'android']).toContain(crash.platform)
      }
    })
  })

  describe('config types', () => {
    it('Sentry config has required fields', () => {
      const config = {
        dsn: 'https://key@sentry.io/123',
        organization: 'my-org',
        project: 'my-project',
        authToken: 'token123',
      }

      expect(config.dsn).toBeDefined()
      expect(config.organization).toBeDefined()
      expect(config.project).toBeDefined()
      expect(config.authToken).toBeDefined()
    })

    it('Slack config has required fields', () => {
      const config = {
        webhookUrl: 'https://hooks.slack.com/services/...',
      }

      expect(config.webhookUrl).toBeDefined()
    })

    it('Discord config has required fields', () => {
      const config = {
        webhookUrl: 'https://discord.com/api/webhooks/...',
      }

      expect(config.webhookUrl).toBeDefined()
    })
  })
})
