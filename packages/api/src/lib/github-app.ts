/**
 * GitHub App Client
 *
 * Creates authenticated GitHub API clients using GitHub App credentials.
 * Uses direct API calls instead of Octokit for Cloudflare Workers compatibility.
 */

import type { Env } from '../types/env'

// =============================================================================
// Types
// =============================================================================

export interface GitHubRepo {
  id: number
  name: string
  fullName: string
  private: boolean
  defaultBranch: string
  owner: {
    login: string
    type: string
  }
}

export interface GitHubContent {
  name: string
  path: string
  type: 'file' | 'dir'
  content?: string
  size?: number
}

interface GitHubInstallationToken {
  token: string
  expiresAt: string
}

// =============================================================================
// JWT Generation
// =============================================================================

/**
 * Generate a JWT for GitHub App authentication
 */
async function generateAppJwt(appId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const payload = {
    iat: now - 60, // 60 seconds in the past for clock drift
    exp: now + 600, // 10 minutes
    iss: appId,
  }

  const base64Header = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const base64Payload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const signatureInput = `${base64Header}.${base64Payload}`

  // Import the private key
  const pemContents = privateKey
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  )

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${base64Header}.${base64Payload}.${base64Signature}`
}

// =============================================================================
// GitHub App Client
// =============================================================================

/**
 * Create a GitHub App API client
 */
export function createGitHubApp(env: Env) {
  const baseUrl = 'https://api.github.com'

  return {
    /**
     * Get an installation access token
     */
    async getInstallationToken(installationId: number): Promise<GitHubInstallationToken> {
      const jwt = await generateAppJwt(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY)

      const response = await fetch(
        `${baseUrl}/app/installations/${String(installationId)}/access_tokens`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${jwt}`,
            'User-Agent': 'BundleNudge',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to get installation token: ${error}`)
      }

      const data = (await response.json())
      return {
        token: data.token,
        expiresAt: data.expires_at,
      }
    },

    /**
     * List repositories accessible to an installation
     */
    async listInstallationRepos(installationId: number): Promise<GitHubRepo[]> {
      const { token } = await this.getInstallationToken(installationId)

      const response = await fetch(`${baseUrl}/installation/repositories?per_page=100`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'BundleNudge',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to list repos: ${error}`)
      }

      interface RepoData {
        id: number
        name: string
        full_name: string
        private: boolean
        default_branch: string
        owner: { login: string; type: string }
      }

      const data = (await response.json())

      return data.repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        defaultBranch: repo.default_branch,
        owner: {
          login: repo.owner.login,
          type: repo.owner.type,
        },
      }))
    },

    /**
     * Get contents of a path in a repository
     */
    async getRepoContents(
      installationId: number,
      owner: string,
      repo: string,
      path: string
    ): Promise<GitHubContent | GitHubContent[]> {
      const { token } = await this.getInstallationToken(installationId)

      const response = await fetch(
        `${baseUrl}/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'BundleNudge',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('NOT_FOUND')
        }
        const error = await response.text()
        throw new Error(`Failed to get contents: ${error}`)
      }

      interface ContentData {
        name: string
        path: string
        type: 'file' | 'dir'
        content?: string
        size?: number
      }

      const data = (await response.json())

      if (Array.isArray(data)) {
        return data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type,
        }))
      }

      return {
        name: data.name,
        path: data.path,
        type: data.type,
        content: data.content ? atob(data.content) : undefined,
        size: data.size,
      }
    },
  }
}

/**
 * Get installation token for a user
 */
export async function getInstallationToken(
  env: Env,
  installationId: number
): Promise<string> {
  const app = createGitHubApp(env)
  const { token } = await app.getInstallationToken(installationId)
  return token
}
