'use client'

import { useState, useEffect } from 'react'
import { API_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface GitHubInstallation {
  id: string
  installationId: number
  accountType: string
  accountLogin: string
  repositorySelection: string
}

interface ConnectGitHubButtonProps {
  onStatusChange?: (connected: boolean) => void
}

export function ConnectGitHubButton({ onStatusChange }: ConnectGitHubButtonProps) {
  const [installations, setInstallations] = useState<GitHubInstallation[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    loadInstallations()
  }, [])

  useEffect(() => {
    const hasInstallations = installations.length > 0
    onStatusChange?.(hasInstallations)
  }, [installations, onStatusChange])

  async function loadInstallations() {
    try {
      const response = await fetch(`${API_URL}/github/installations`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json() as { installations?: GitHubInstallation[] }
        setInstallations(data.installations ?? [])
      } else {
        setInstallations([])
      }
    } catch {
      setInstallations([])
    } finally {
      setLoading(false)
    }
  }

  function handleConnect() {
    setConnecting(true)
    // Redirect to GitHub App installation page via API
    window.location.href = `${API_URL}/github/install`
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  // Show connected installations
  if (installations.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {installations.map((installation) => (
          <div key={installation.id} className="flex items-center gap-2">
            <GitHubIcon className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-700">
              @{installation.accountLogin}
            </span>
            <span className="text-xs text-neutral-400">
              ({installation.repositorySelection === 'all' ? 'All repos' : 'Selected repos'})
            </span>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnect}
          disabled={connecting}
          className="gap-2 mt-1"
        >
          <GitHubIcon className="w-4 h-4" />
          <span>Add another account</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      className="gap-2 bg-[#24292f] hover:bg-[#24292f]/90"
    >
      {connecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <GitHubIcon className="w-4 h-4" />
          <span>Connect GitHub</span>
        </>
      )}
    </Button>
  )
}

function GitHubIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export { GitHubIcon }
