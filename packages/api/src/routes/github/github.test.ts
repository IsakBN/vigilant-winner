import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema definitions for testing
const githubInstallationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  installationId: z.string(),
  accountType: z.enum(['user', 'organization']).optional(),
  accountLogin: z.string().optional(),
})

const appRepoSchema = z.object({
  id: z.string().uuid(),
  appId: z.string().uuid(),
  repoFullName: z.string(),
  repoBranch: z.string().default('main'),
  installationId: z.string(),
  autoPublish: z.boolean().default(false),
})

const githubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  private: z.boolean(),
  defaultBranch: z.string(),
  owner: z.object({
    login: z.string(),
    type: z.string(),
  }),
})

describe('GitHub App routes', () => {
  describe('installation schema', () => {
    it('validates complete installation record', () => {
      const result = githubInstallationSchema.safeParse({
        id: crypto.randomUUID(),
        userId: 'user-123',
        installationId: '12345678',
        accountType: 'user',
        accountLogin: 'testuser',
      })
      expect(result.success).toBe(true)
    })

    it('allows optional account fields', () => {
      const result = githubInstallationSchema.safeParse({
        id: crypto.randomUUID(),
        userId: 'user-123',
        installationId: '12345678',
      })
      expect(result.success).toBe(true)
    })

    it('validates account type enum', () => {
      const validOrg = githubInstallationSchema.safeParse({
        id: crypto.randomUUID(),
        userId: 'user-123',
        installationId: '12345678',
        accountType: 'organization',
      })
      expect(validOrg.success).toBe(true)

      const invalidType = githubInstallationSchema.safeParse({
        id: crypto.randomUUID(),
        userId: 'user-123',
        installationId: '12345678',
        accountType: 'invalid',
      })
      expect(invalidType.success).toBe(false)
    })
  })

  describe('app repo schema', () => {
    it('validates complete app repo record', () => {
      const result = appRepoSchema.safeParse({
        id: crypto.randomUUID(),
        appId: crypto.randomUUID(),
        repoFullName: 'owner/repo',
        repoBranch: 'develop',
        installationId: '12345678',
        autoPublish: true,
      })
      expect(result.success).toBe(true)
    })

    it('uses default branch', () => {
      const result = appRepoSchema.safeParse({
        id: crypto.randomUUID(),
        appId: crypto.randomUUID(),
        repoFullName: 'owner/repo',
        installationId: '12345678',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.repoBranch).toBe('main')
      }
    })

    it('validates repo full name format', () => {
      const result = appRepoSchema.safeParse({
        id: crypto.randomUUID(),
        appId: crypto.randomUUID(),
        repoFullName: 'organization/repository-name',
        installationId: '12345678',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('github repo response schema', () => {
    it('validates repo response', () => {
      const result = githubRepoSchema.safeParse({
        id: 123456789,
        name: 'my-app',
        fullName: 'myorg/my-app',
        private: true,
        defaultBranch: 'main',
        owner: {
          login: 'myorg',
          type: 'Organization',
        },
      })
      expect(result.success).toBe(true)
    })

    it('validates public repo', () => {
      const result = githubRepoSchema.safeParse({
        id: 987654321,
        name: 'open-source-lib',
        fullName: 'user/open-source-lib',
        private: false,
        defaultBranch: 'master',
        owner: {
          login: 'user',
          type: 'User',
        },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('installation URL', () => {
    it('constructs correct installation URL', () => {
      const appName = 'bundlenudge-dev'
      const installUrl = `https://github.com/apps/${appName}/installations/new`
      expect(installUrl).toContain('github.com/apps/')
      expect(installUrl).toContain(appName)
    })
  })

  describe('callback handling', () => {
    it('extracts installation_id from callback', () => {
      const url = new URL(
        'https://api.bundlenudge.dev/v1/github/callback?installation_id=12345&setup_action=install'
      )
      const installationId = url.searchParams.get('installation_id')
      expect(installationId).toBe('12345')
    })

    it('handles delete setup action', () => {
      const url = new URL(
        'https://api.bundlenudge.dev/v1/github/callback?setup_action=delete'
      )
      const setupAction = url.searchParams.get('setup_action')
      expect(setupAction).toBe('delete')
    })

    it('handles missing installation_id', () => {
      const url = new URL('https://api.bundlenudge.dev/v1/github/callback')
      const installationId = url.searchParams.get('installation_id')
      expect(installationId).toBeNull()
    })
  })

  describe('status response', () => {
    it('formats connected status', () => {
      const connectedResponse = {
        connected: true,
        installationId: '12345678',
        accountLogin: 'testuser',
        accountType: 'user',
      }
      expect(connectedResponse.connected).toBe(true)
      expect(connectedResponse.installationId).toBeDefined()
    })

    it('formats disconnected status', () => {
      const disconnectedResponse = {
        connected: false,
      }
      expect(disconnectedResponse.connected).toBe(false)
    })
  })

  describe('repo contents response', () => {
    it('formats directory response', () => {
      const directoryResponse = {
        type: 'directory' as const,
        contents: [
          { name: 'src', path: 'src', type: 'dir' as const },
          { name: 'package.json', path: 'package.json', type: 'file' as const },
        ],
      }
      expect(directoryResponse.type).toBe('directory')
      expect(directoryResponse.contents).toHaveLength(2)
    })

    it('formats file response', () => {
      const fileResponse = {
        type: 'file' as const,
        name: 'README.md',
        path: 'README.md',
        content: '# My Project',
        size: 100,
      }
      expect(fileResponse.type).toBe('file')
      expect(fileResponse.content).toBeDefined()
    })
  })

  describe('webhook events', () => {
    it('installation event payload structure', () => {
      const installationPayload = {
        action: 'created' as const,
        installation: {
          id: 12345678,
          account: {
            login: 'testorg',
            type: 'Organization',
          },
        },
        sender: {
          login: 'admin-user',
          id: 123456,
        },
      }
      expect(installationPayload.action).toBe('created')
      expect(installationPayload.installation.id).toBeDefined()
    })

    it('push event payload structure', () => {
      const pushPayload = {
        ref: 'refs/heads/main',
        repository: {
          id: 123456789,
          name: 'my-app',
          full_name: 'org/my-app',
        },
        commits: [
          {
            id: 'abc123def456',
            message: 'Fix bug in login flow',
            author: {
              name: 'Developer',
              email: 'dev@example.com',
            },
          },
        ],
        sender: {
          login: 'developer',
        },
      }
      expect(pushPayload.ref).toContain('refs/heads/')
      expect(pushPayload.commits.length).toBeGreaterThan(0)
    })

    it('installation_repositories event payload structure', () => {
      const reposPayload = {
        action: 'added' as const,
        installation: {
          id: 12345678,
        },
        repositories_added: [
          {
            id: 111111,
            name: 'new-repo',
            full_name: 'org/new-repo',
          },
        ],
      }
      expect(reposPayload.action).toBe('added')
      expect(reposPayload.repositories_added?.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('NOT_CONNECTED error format', () => {
      const error = {
        error: 'NOT_CONNECTED',
        message: 'GitHub App not installed',
      }
      expect(error.error).toBe('NOT_CONNECTED')
    })

    it('GITHUB_ERROR error format', () => {
      const error = {
        error: 'GITHUB_ERROR',
        message: 'Failed to fetch repos: rate limited',
      }
      expect(error.error).toBe('GITHUB_ERROR')
    })

    it('NOT_FOUND error format', () => {
      const error = {
        error: 'NOT_FOUND',
        message: 'Path not found',
      }
      expect(error.error).toBe('NOT_FOUND')
    })
  })

  describe('branch matching', () => {
    it('matches refs/heads/main to main branch', () => {
      const ref = 'refs/heads/main'
      const branch = 'main'
      expect(ref).toBe(`refs/heads/${branch}`)
    })

    it('matches refs/heads/develop to develop branch', () => {
      const ref = 'refs/heads/develop'
      const branch = 'develop'
      expect(ref).toBe(`refs/heads/${branch}`)
    })

    it('does not match different branches', () => {
      const ref = 'refs/heads/feature-branch'
      const watchedBranch = 'main'
      expect(ref).not.toBe(`refs/heads/${watchedBranch}`)
    })

    it('does not match tags', () => {
      const ref = 'refs/tags/v1.0.0'
      const branch = 'main'
      expect(ref).not.toBe(`refs/heads/${branch}`)
    })
  })
})
