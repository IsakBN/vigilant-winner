'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Smartphone, Tablet, Loader2, ExternalLink } from 'lucide-react'
import { cn, Button, Input, Label } from '@bundlenudge/shared-ui'
import { GitHubIcon } from '@/components/settings'
import { integrations, type Platform, type CreateAppInput, type GitHubRepository } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface ConnectRepoFormProps {
    accountId: string
    onSubmit: (data: CreateAppInput) => void
    isLoading?: boolean
    error?: string | null
}

interface FormErrors {
    name?: string
    repo?: string
}

// =============================================================================
// Platform Selector Component
// =============================================================================

interface PlatformSelectorProps {
    value: Platform
    onChange: (platform: Platform) => void
}

function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
    const platforms: { id: Platform; label: string; icon: typeof Smartphone }[] = [
        { id: 'ios', label: 'iOS', icon: Smartphone },
        { id: 'android', label: 'Android', icon: Tablet },
    ]

    return (
        <div className="grid grid-cols-2 gap-3">
            {platforms.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        value === id
                            ? 'border-bright-accent bg-bright-accent/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                >
                    <Icon
                        className={cn(
                            'w-8 h-8',
                            value === id ? 'text-bright-accent' : 'text-gray-400'
                        )}
                    />
                    <span
                        className={cn(
                            'font-medium',
                            value === id ? 'text-bright-accent' : 'text-gray-600'
                        )}
                    >
                        {label}
                    </span>
                </button>
            ))}
        </div>
    )
}

// =============================================================================
// Repository Selector Component
// =============================================================================

interface RepoSelectorProps {
    repos: GitHubRepository[]
    value: string
    onChange: (repo: string) => void
    isLoading: boolean
    error?: string
}

function RepoSelector({ repos, value, onChange, isLoading, error }: RepoSelectorProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading repositories...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        )
    }

    if (repos.length === 0) {
        return (
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">
                    No repositories found. Make sure you have access to at least one repository.
                </p>
            </div>
        )
    }

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                'w-full p-3 border rounded-lg bg-white',
                'focus:outline-none focus:ring-2 focus:ring-bright-accent/50 focus:border-bright-accent',
                !value && 'text-gray-400'
            )}
        >
            <option value="">Select a repository...</option>
            {repos.map((repo) => (
                <option key={repo.id} value={repo.fullName}>
                    {repo.fullName}
                    {repo.private && ' (private)'}
                </option>
            ))}
        </select>
    )
}

// =============================================================================
// GitHub Not Connected State
// =============================================================================

interface GitHubNotConnectedProps {
    accountId: string
}

function GitHubNotConnected({ accountId }: GitHubNotConnectedProps) {
    const handleConnect = () => {
        window.location.href = `/api/auth/github?accountId=${accountId}&redirect=/dashboard/${accountId}/apps/new`
    }

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <div className="w-8 h-8 text-gray-600">
                    <GitHubIcon />
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect GitHub</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
                Connect your GitHub account to import repositories and enable automatic deployments.
            </p>
            <Button onClick={handleConnect} size="lg" className="gap-2">
                <GitHubIcon />
                Connect GitHub
            </Button>
        </div>
    )
}

// =============================================================================
// Platform Detection Helper
// =============================================================================

function detectPlatformFromRepo(repo: GitHubRepository): Platform {
    // Check language first
    const lang = repo.language?.toLowerCase()
    if (lang === 'swift' || lang === 'objective-c') {
        return 'ios'
    }
    if (lang === 'kotlin' || lang === 'java') {
        return 'android'
    }

    // Check repo name for hints
    const name = repo.name.toLowerCase()
    if (name.includes('ios') || name.includes('iphone') || name.includes('ipad')) {
        return 'ios'
    }
    if (name.includes('android')) {
        return 'android'
    }

    // Default to iOS
    return 'ios'
}

function getAppNameFromRepo(repoFullName: string): string {
    const parts = repoFullName.split('/')
    const repoName = parts[parts.length - 1]
    // Convert kebab-case or snake_case to Title Case
    return repoName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

// =============================================================================
// Form Validation
// =============================================================================

function validateForm(name: string, selectedRepo: string): FormErrors {
    const errors: FormErrors = {}

    if (!name.trim()) {
        errors.name = 'App name is required'
    } else if (name.length > 100) {
        errors.name = 'App name must be 100 characters or less'
    }

    if (!selectedRepo) {
        errors.repo = 'Please select a repository'
    }

    return errors
}

// =============================================================================
// Main Component
// =============================================================================

export function ConnectRepoForm({ accountId, onSubmit, isLoading = false, error }: ConnectRepoFormProps) {
    const [platform, setPlatform] = useState<Platform>('ios')
    const [name, setName] = useState('')
    const [selectedRepo, setSelectedRepo] = useState('')
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    // Fetch GitHub status
    const { data: githubStatus, isLoading: statusLoading } = useQuery({
        queryKey: ['github', 'status'],
        queryFn: () => integrations.getGitHubStatus(),
    })

    // Fetch GitHub repos (only if connected)
    const { data: reposData, isLoading: reposLoading, error: reposError } = useQuery({
        queryKey: ['github', 'repos'],
        queryFn: () => integrations.listGitHubRepos(),
        enabled: githubStatus?.connected === true,
    })

    const repos = useMemo(() => reposData?.repos ?? [], [reposData?.repos])

    // Auto-fill app name and detect platform when repo is selected
    useEffect(() => {
        if (selectedRepo && repos.length > 0) {
            const repo = repos.find((r) => r.fullName === selectedRepo)
            if (repo) {
                // Only auto-fill name if it hasn't been manually edited
                if (!touched.name) {
                    setName(getAppNameFromRepo(selectedRepo))
                }
                // Detect platform from repo
                setPlatform(detectPlatformFromRepo(repo))
            }
        }
    }, [selectedRepo, repos, touched.name])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const formErrors = validateForm(name, selectedRepo)
        setErrors(formErrors)

        if (Object.keys(formErrors).length > 0) {
            setTouched({ name: true, repo: true })
            return
        }

        onSubmit({
            name: name.trim(),
            platform,
            githubRepo: selectedRepo,
        })
    }

    function handleBlur(field: keyof FormErrors) {
        setTouched((prev) => ({ ...prev, [field]: true }))
        const formErrors = validateForm(name, selectedRepo)
        setErrors((prev) => ({ ...prev, [field]: formErrors[field] }))
    }

    // Show loading state while checking GitHub status
    if (statusLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        )
    }

    // Show connect GitHub prompt if not connected
    if (!githubStatus?.connected) {
        return <GitHubNotConnected accountId={accountId} />
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorAlert message={error} />}

            {/* Connected GitHub Account */}
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600">
                    <GitHubIcon />
                </span>
                <span className="text-sm text-green-700">
                    Connected as <strong>{githubStatus.username}</strong>
                </span>
                <a
                    href={`/dashboard/${accountId}/settings/integrations`}
                    className="ml-auto text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                    Manage <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Repository Selector */}
            <div className="space-y-2">
                <Label htmlFor="repo">Repository</Label>
                <RepoSelector
                    repos={repos}
                    value={selectedRepo}
                    onChange={(repo) => {
                        setSelectedRepo(repo)
                        setTouched((prev) => ({ ...prev, repo: true }))
                    }}
                    isLoading={reposLoading}
                    error={reposError?.message}
                />
                {touched.repo && errors.repo && (
                    <p className="text-sm text-red-500">{errors.repo}</p>
                )}
            </div>

            {/* App Name */}
            <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value)
                        setTouched((prev) => ({ ...prev, name: true }))
                    }}
                    onBlur={() => handleBlur('name')}
                    placeholder="My Awesome App"
                    disabled={isLoading}
                    className={cn(touched.name && errors.name && 'border-red-500')}
                />
                <p className="text-sm text-gray-500">
                    Auto-filled from repository name. You can edit this.
                </p>
                {touched.name && errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                )}
            </div>

            {/* Platform Selector */}
            <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <PlatformSelector value={platform} onChange={setPlatform} />
                <p className="text-sm text-gray-500">
                    Auto-detected from repository. You can change this.
                </p>
            </div>

            <Button
                type="submit"
                disabled={isLoading || !selectedRepo}
                size="lg"
                className="w-full bg-bright-accent text-white hover:opacity-90"
            >
                {isLoading ? 'Connecting Repository...' : 'Connect Repository'}
            </Button>
        </form>
    )
}

// =============================================================================
// Helper Components
// =============================================================================

function ErrorAlert({ message }: { message: string }) {
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {message}
        </div>
    )
}
