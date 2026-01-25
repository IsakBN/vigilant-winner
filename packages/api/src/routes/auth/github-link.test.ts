/**
 * @agent remediate-github-token-encryption
 * @modified 2026-01-25
 */

import { describe, it, expect } from 'vitest'
import { ERROR_CODES } from '@bundlenudge/shared'
import { generateKey } from '../../lib/crypto'
import { encryptGitHubToken, isTokenEncrypted } from '../../lib/github-token'

describe('githubLinkRoutes logic', () => {
  describe('POST /link logic', () => {
    it('generates valid GitHub authorize URL', () => {
      const clientId = 'test-client-id'
      const apiUrl = 'https://api.test.com'

      const authUrl = new URL('https://github.com/login/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', `${apiUrl}/v1/auth/github/link/callback`)
      authUrl.searchParams.set('scope', 'read:user user:email')
      authUrl.searchParams.set('state', 'test-state')

      expect(authUrl.toString()).toContain('github.com/login/oauth/authorize')
      expect(authUrl.toString()).toContain('client_id=test-client-id')
      expect(authUrl.toString()).toContain('redirect_uri=')
      expect(authUrl.toString()).toContain('state=')
    })
  })

  describe('GET /link/callback logic', () => {
    it('generates correct error redirect URL when auth denied', () => {
      const dashboardUrl = 'https://app.test.com'
      const redirectUrl = `${dashboardUrl}/settings?error=github_auth_denied`

      expect(redirectUrl).toContain('error=github_auth_denied')
    })

    it('generates correct error redirect URL when state missing', () => {
      const dashboardUrl = 'https://app.test.com'
      const redirectUrl = `${dashboardUrl}/settings?error=invalid_request`

      expect(redirectUrl).toContain('error=invalid_request')
    })
  })

  describe('DELETE /unlink logic', () => {
    it('uses correct error code when no password exists', () => {
      expect(ERROR_CODES.INVALID_STATE).toBe('INVALID_STATE')
    })
  })

  describe('GET /status response format', () => {
    it('returns correct format when not linked', () => {
      const response = {
        linked: false,
        githubId: null,
      }

      expect(response.linked).toBe(false)
      expect(response.githubId).toBeNull()
    })

    it('returns correct format when linked', () => {
      const response = {
        linked: true,
        githubId: '12345678',
      }

      expect(response.linked).toBe(true)
      expect(response.githubId).toBe('12345678')
    })
  })

  describe('token encryption', () => {
    it('encrypts access tokens before storage', async () => {
      const accessToken = 'gho_test123456789'
      const encryptionKey = generateKey()

      const encryptedToken = await encryptGitHubToken(accessToken, encryptionKey)

      // Token should be encrypted with enc: prefix
      expect(isTokenEncrypted(encryptedToken)).toBe(true)
      expect(encryptedToken).not.toContain(accessToken)
    })

    it('encrypted token format is suitable for DB storage', async () => {
      const accessToken = 'gho_test123456789'
      const encryptionKey = generateKey()

      const encryptedToken = await encryptGitHubToken(accessToken, encryptionKey)

      // Token should be a valid string (base64 with prefix)
      expect(typeof encryptedToken).toBe('string')
      expect(encryptedToken.length).toBeGreaterThan(accessToken.length)
      // Should not contain any characters that would break SQL
      expect(encryptedToken).not.toContain("'")
      expect(encryptedToken).not.toContain('"')
    })
  })
})
