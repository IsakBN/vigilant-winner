'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/providers/AuthProvider'
import { useApps, useCreateApp } from '@/hooks/useApps'
import { apps as appsApi, type GitHubRepo } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ConnectGitHubButton } from '@/components/github/ConnectGitHubButton'
import { FolderBrowser } from '@/components/FolderBrowser'
import { UpdateFunnel } from '@/components/dashboard/UpdateFunnel'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { AppHealthTable, type AppHealthData } from '@/components/dashboard/AppHealthTable'

// =============================================================================
// Constants
// =============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  invalid_request: "Hmm, something went wrong connecting to GitHub. Let's try that again!",
  invalid_state: "Your session timed out while connecting to GitHub. Click 'Connect GitHub' to start fresh.",
  token_exchange_failed: "We couldn't complete the GitHub connection. This is usually temporary - give it another shot!",
  no_repos: "No repositories found. Make sure you've granted BundleNudge access to at least one repo.",
  no_installations: "You haven't installed the BundleNudge GitHub App yet. Click 'Connect GitHub' to get started!",
  webhook_failed: "Couldn't set up the webhook on your repo. Make sure you have admin access to the repository.",
  unknown: "Something unexpected happened. Please try again or reach out to support.",
}

// =============================================================================
// Helpers
// =============================================================================

function getUserFriendlyError(error: string): string {
  if (ERROR_MESSAGES[error]) {
    return ERROR_MESSAGES[error]
  }

  const errorLower = error.toLowerCase()

  if (errorLower.includes('webhook') || errorLower.includes('hook')) {
    return "We couldn't set up the webhook on your repository. Make sure you have admin access."
  }
  if (errorLower.includes('permission') || errorLower.includes('access') || errorLower.includes('forbidden')) {
    return "You don't have permission to access this repository. Make sure you have admin access."
  }
  if (errorLower.includes('rate limit')) {
    return "GitHub is temporarily limiting requests. Please wait a minute and try again."
  }
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('timeout')) {
    return "We're having trouble connecting. Please check your internet connection and try again."
  }

  return "Something didn't work as expected. Please try again."
}

type Notification = { type: 'success' | 'error'; message: string }

function getInitialNotification(searchParams: URLSearchParams): Notification | null {
  const githubConnected = searchParams.get('github_connected')
  const githubError = searchParams.get('github_error')

  if (githubConnected === 'true') {
    return { type: 'success', message: 'GitHub connected successfully!' }
  }
  if (githubError) {
    return {
      type: 'error',
      message: ERROR_MESSAGES[githubError] ?? 'Failed to connect GitHub. Please try again.',
    }
  }
  return null
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${String(days)}d ago`
  if (hours > 0) return `${String(hours)}h ago`
  if (minutes > 0) return `${String(minutes)}m ago`
  return 'just now'
}

// =============================================================================
// Data Converters
// =============================================================================

interface AppWithRelease {
  id: string
  name: string
  platform: 'ios' | 'android'
  latestRelease?: {
    version: string
    status: string
    created_at: number
  } | null
}

function convertToAppHealthData(appList: AppWithRelease[]): AppHealthData[] {
  return appList.map((app) => {
    const release = app.latestRelease
    let status: AppHealthData['status'] = 'setup_required'

    if (release) {
      const releaseStatus = release.status
      if (releaseStatus === 'complete') {
        status = 'healthy'
      } else if (releaseStatus === 'failed' || releaseStatus === 'rolled_back') {
        status = 'critical'
      } else if (releaseStatus === 'paused') {
        status = 'warning'
      } else {
        status = 'healthy'
      }
    }

    return {
      id: app.id,
      name: app.name,
      status,
      latestVersion: release?.version ?? null,
      lastUpdated: release?.created_at ?? null,
      devices: 0,
      successRate: release ? 99.5 : 0,
      sparkline: [0, 0, 0, 0, 0, 0, 0],
    }
  })
}

interface RecentRelease {
  version: string
  appName: string
  timestamp: number
  appId: string
}

function getRecentReleases(appList: AppWithRelease[]): RecentRelease[] {
  const releases: RecentRelease[] = []

  for (const app of appList) {
    if (app.latestRelease) {
      releases.push({
        version: app.latestRelease.version,
        appName: app.name,
        timestamp: app.latestRelease.created_at,
        appId: app.id,
      })
    }
  }

  return releases.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
}

// =============================================================================
// Main Component
// =============================================================================

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const accountId = params.accountId as string

  // Apps data
  const {
    apps: rawApps,
    isLoading: appsLoading,
    error: appsError,
  } = useApps(accountId)

  const createAppMutation = useCreateApp(accountId)

  // Transform raw apps to AppWithRelease format
  const apps: AppWithRelease[] = rawApps.map((app) => ({
    id: app.id,
    name: app.name,
    platform: app.platform,
    latestRelease: app.lastReleaseAt ? {
      version: app.lastReleaseVersion ?? '1.0.0',
      status: 'complete',
      created_at: app.lastReleaseAt,
    } : null,
  }))

  const [githubConnected, setGithubConnected] = useState(false)
  const cleanedUpRef = useRef(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Notification from URL params
  const [notification, setNotification] = useState<Notification | null>(() =>
    getInitialNotification(searchParams)
  )

  // Connect repo dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [selectedInstallationId, setSelectedInstallationId] = useState<number | null>(null)
  const [appName, setAppName] = useState('')
  const [buildFolder, setBuildFolder] = useState('')
  const [showFolderBrowser, setShowFolderBrowser] = useState(false)

  // Clean up URL params on mount
  useEffect(() => {
    if (cleanedUpRef.current) return

    const githubConnectedParam = searchParams.get('github_connected')
    const githubErrorParam = searchParams.get('github_error')

    if (githubConnectedParam === 'true' || githubErrorParam) {
      cleanedUpRef.current = true
      router.replace(`/dashboard/${accountId}`)
    }
  }, [searchParams, router, accountId])

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleGitHubStatusChange = useCallback((connected: boolean) => {
    setGithubConnected(connected)
  }, [])

  const handleDismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
  }, [])

  async function handleOpenDialog() {
    if (!githubConnected) return

    setDialogOpen(true)
    setLoadingRepos(true)
    setReposError(null)
    setRepos([])
    setSelectedRepo('')
    setSelectedInstallationId(null)
    setAppName('')
    setBuildFolder('')
    setShowFolderBrowser(false)

    try {
      const { repos: fetchedRepos } = await appsApi.listRepos()
      setRepos(fetchedRepos)
    } catch (err) {
      setReposError(getUserFriendlyError(err instanceof Error ? err.message : 'Failed to load repositories'))
    } finally {
      setLoadingRepos(false)
    }
  }

  async function handleCreateApp(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRepo || !appName) return

    setReposError(null)

    try {
      const result = await createAppMutation.mutateAsync({
        name: appName,
        platform: 'ios', // Default platform
      })

      setDialogOpen(false)
      router.push(`/dashboard/${accountId}/apps/${result.app.id}`)
    } catch (err) {
      setReposError(getUserFriendlyError(err instanceof Error ? err.message : 'Failed to create app'))
    }
  }

  function handleSelectRepo(repo: GitHubRepo) {
    setSelectedRepo(repo.full_name)
    setSelectedInstallationId(repo.installation_id)
    const repoName = repo.full_name.split('/')[1] ?? repo.full_name
    setAppName(repoName)
    setBuildFolder('')
    setShowFolderBrowser(false)
  }

  // Derived data
  const appHealthData = convertToAppHealthData(apps)
  const recentReleases = getRecentReleases(apps)

  // Mock funnel data
  const funnelData = {
    checks: apps.length * 100,
    downloads: Math.round(apps.length * 35),
    applied: Math.round(apps.length * 33),
    active: Math.round(apps.length * 32),
  }

  // Mock alerts - replace with real data
  type Alert = {
    id: string
    type: 'warning' | 'info'
    title: string
    message: string
    dismissible?: boolean
  }
  const alerts: Alert[] = [
    // Add real alerts here when backend is ready
  ]
  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id))

  // Loading state
  if (authLoading || (appsLoading && apps.length === 0)) {
    return (
      <div className="min-h-screen bg-cream-bg">
        <div className="container-fluid py-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-14" />
            <Skeleton className="h-64" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="container-fluid py-8 space-y-6">
        {/* Notification banner */}
        {notification && (
          <div
            className={`px-4 py-3 flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-destructive/10 border border-destructive/20 text-destructive'
            }`}
          >
            <span className="text-sm">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-current opacity-60 hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* GitHub not connected warning */}
        {!githubConnected && (
          <div className="px-4 py-4 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-neutral-900">Connect your GitHub account</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  To connect a repository and enable OTA updates, you need to connect your GitHub account first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-white border border-neutral-200 p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-neutral-600 mt-1">
            {apps.length === 0
              ? 'Get started by connecting your first GitHub repository.'
              : `You have ${String(apps.length)} app${apps.length === 1 ? '' : 's'} in this account.`
            }
          </p>
        </div>

        {/* Update Health Funnel */}
        {apps.length > 0 && (
          <div className="bg-white border border-neutral-200 p-4">
            <h2 className="text-sm font-medium text-neutral-700 mb-3 uppercase tracking-wide">
              Update Health (7 days)
            </h2>
            <UpdateFunnel data={funnelData} showDropoff={false} compact />
          </div>
        )}

        {/* Alerts */}
        {visibleAlerts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-neutral-700 uppercase tracking-wide">
              Alerts & Issues
            </h2>
            {visibleAlerts.map((alert) => (
              <AlertBanner
                key={alert.id}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onDismiss={alert.dismissible ? () => handleDismissAlert(alert.id) : undefined}
              />
            ))}
          </div>
        )}

        {/* App Health Table */}
        <div className="bg-white border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-700 uppercase tracking-wide">
              App Health Summary
            </h2>
            <div className="flex items-center gap-2">
              <ConnectGitHubButton onStatusChange={handleGitHubStatusChange} />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void handleOpenDialog()}
                    disabled={!githubConnected}
                    title={!githubConnected ? 'Connect GitHub first to add a repository' : undefined}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Connect Repo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <form onSubmit={(e) => void handleCreateApp(e)}>
                    <DialogHeader>
                      <DialogTitle>Connect GitHub Repository</DialogTitle>
                      <DialogDescription>
                        Select a repository to connect for OTA updates
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                      {loadingRepos ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full mx-auto mb-2" />
                          <p className="text-sm text-neutral-500">Loading repositories...</p>
                        </div>
                      ) : reposError ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-sm text-destructive mb-4">{reposError}</p>
                          <Button type="button" variant="outline" onClick={() => void handleOpenDialog()}>
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Repository Selection */}
                          <div className="space-y-2">
                            <Label>Repository</Label>
                            <div className="max-h-48 overflow-y-auto border border-neutral-200">
                              {repos.length === 0 ? (
                                <p className="p-4 text-sm text-neutral-500 text-center">
                                  No repositories found
                                </p>
                              ) : (
                                repos.map((repo) => (
                                  <button
                                    key={repo.id}
                                    type="button"
                                    onClick={() => handleSelectRepo(repo)}
                                    className={`w-full text-left p-3 border-b border-neutral-100 last:border-0 transition-colors ${
                                      selectedRepo === repo.full_name
                                        ? 'bg-neutral-900 text-white'
                                        : 'hover:bg-neutral-50'
                                    }`}
                                  >
                                    <div className="font-medium text-sm">{repo.full_name}</div>
                                    {repo.private && (
                                      <span className={`text-xs ${
                                        selectedRepo === repo.full_name ? 'text-neutral-300' : 'text-neutral-500'
                                      }`}>
                                        Private
                                      </span>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>

                          {/* App Name */}
                          {selectedRepo && (
                            <div className="space-y-2">
                              <Label htmlFor="app-name">App Name</Label>
                              <Input
                                id="app-name"
                                placeholder="My App"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                              />
                              <p className="text-xs text-neutral-500">
                                This is how your app will appear in the dashboard
                              </p>
                            </div>
                          )}

                          {/* Build Folder Selection */}
                          {selectedRepo && selectedInstallationId && (
                            <div className="space-y-2">
                              <Label>Build Folder (for monorepos)</Label>

                              {showFolderBrowser ? (
                                <FolderBrowser
                                  installationId={selectedInstallationId}
                                  owner={selectedRepo.split('/')[0] ?? ''}
                                  repo={selectedRepo.split('/')[1] ?? ''}
                                  initialPath={buildFolder}
                                  onSelect={(path) => {
                                    setBuildFolder(path)
                                    setShowFolderBrowser(false)
                                  }}
                                  onCancel={() => setShowFolderBrowser(false)}
                                />
                              ) : (
                                <div className="flex gap-2">
                                  <div className="flex-1 px-3 py-2 border rounded-md bg-neutral-50 text-sm">
                                    {buildFolder || <span className="text-neutral-400">Repository root</span>}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowFolderBrowser(true)}
                                  >
                                    Browse
                                  </Button>
                                </div>
                              )}

                              <p className="text-xs text-neutral-500">
                                Select the folder containing your React Native app&apos;s package.json
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAppMutation.isPending || !selectedRepo || !appName}
                      >
                        {createAppMutation.isPending ? 'Creating...' : 'Connect Repository'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {appsError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 mb-4">
              {getUserFriendlyError(appsError instanceof Error ? appsError.message : 'Failed to load apps')}
            </div>
          )}

          {apps.length === 0 ? (
            <EmptyState onConnect={() => void handleOpenDialog()} githubConnected={githubConnected} />
          ) : (
            <AppHealthTable apps={appHealthData} accountId={accountId} />
          )}
        </div>

        {/* Recent Activity & Quick Actions */}
        {apps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <div className="bg-white border border-neutral-200 p-4">
              <h2 className="text-sm font-medium text-neutral-700 mb-3 uppercase tracking-wide">
                Recent Activity
              </h2>
              {recentReleases.length === 0 ? (
                <p className="text-sm text-neutral-500">No recent releases</p>
              ) : (
                <ul className="space-y-2">
                  {recentReleases.map((release, index) => (
                    <li key={`${release.appId}-${release.version}-${String(index)}`} className="flex items-center gap-3 text-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <Link
                        href={`/dashboard/${accountId}/apps/${release.appId}`}
                        className="hover:text-primary transition-colors"
                      >
                        <span className="font-mono">{release.version}</span>
                        <span className="text-neutral-500 ml-1.5">pushed {getRelativeTime(release.timestamp)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-neutral-200 p-4">
              <h2 className="text-sm font-medium text-neutral-700 mb-3 uppercase tracking-wide">
                Quick Actions
              </h2>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => void handleOpenDialog()}
                  disabled={!githubConnected}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Connect New Repo
                </Button>
                {apps.length > 0 && (
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <Link href={`/dashboard/${accountId}/apps/${apps[0].id}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      View Latest App
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ onConnect, githubConnected }: { onConnect: () => void; githubConnected: boolean }) {
  return (
    <div className="text-center py-12 px-8">
      <div className="w-16 h-16 mx-auto mb-6 bg-neutral-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">No apps yet</h2>
      <p className="text-neutral-500 mb-6 max-w-md mx-auto">
        {githubConnected
          ? 'Connect your first GitHub repository to start pushing OTA updates to your React Native app.'
          : 'Connect your GitHub account first, then add a repository to start pushing OTA updates.'}
      </p>
      <Button
        className="gap-2"
        onClick={onConnect}
        disabled={!githubConnected}
        title={!githubConnected ? 'Connect GitHub first to add a repository' : undefined}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        Connect GitHub Repository
      </Button>
    </div>
  )
}
