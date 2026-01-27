'use client'

/**
 * App Settings Page
 *
 * Comprehensive settings page with sections for:
 * - General settings (app name, bundle ID)
 * - Webhooks
 * - Apple credentials
 * - Crash reporting integrations
 * - Danger zone (delete app)
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useApp, useUpdateApp, useDeleteApp, useRegenerateApiKey } from '@/hooks/useApp'
import { useHealthConfig } from '@/hooks/useHealthConfig'
import { ApiKeyManager } from '@/components/apps/ApiKeyManager'
import { HealthConfigEditor } from '@/components/apps/HealthConfigEditor'
import {
    GeneralSettingsSection,
    WebhooksSection,
    AppleCredentialsSection,
    CrashIntegrationsSection,
    DangerZoneSection,
} from '@/components/apps/settings'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// =============================================================================
// Types
// =============================================================================

type SectionKey = 'general' | 'integrations' | 'health' | 'danger'

// =============================================================================
// Section Accordion
// =============================================================================

interface SectionAccordionProps {
    id: SectionKey
    title: string
    expanded: boolean
    onToggle: () => void
    children: React.ReactNode
    variant?: 'default' | 'danger'
    badge?: string
}

function SectionAccordion({
    id,
    title,
    expanded,
    onToggle,
    children,
    variant = 'default',
    badge,
}: SectionAccordionProps) {
    const isDanger = variant === 'danger'

    return (
        <section id={id}>
            <button
                onClick={onToggle}
                className={`w-full flex items-center justify-between py-3 px-4 border transition-colors ${
                    isDanger
                        ? 'bg-red-50 border-red-200 hover:bg-red-100'
                        : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                }`}
            >
                <div className="flex items-center gap-2">
                    {expanded ? (
                        <ChevronDown
                            className={`w-5 h-5 ${isDanger ? 'text-red-500' : 'text-neutral-500'}`}
                        />
                    ) : (
                        <ChevronRight
                            className={`w-5 h-5 ${isDanger ? 'text-red-500' : 'text-neutral-500'}`}
                        />
                    )}
                    <span
                        className={`font-semibold ${isDanger ? 'text-red-700' : 'text-neutral-900'}`}
                    >
                        {title}
                    </span>
                </div>
                {badge && (
                    <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
            </button>
            {expanded && (
                <div
                    className={`border border-t-0 p-4 space-y-4 ${
                        isDanger ? 'border-red-200' : 'border-neutral-200'
                    }`}
                >
                    {children}
                </div>
            )}
        </section>
    )
}

// =============================================================================
// Main Page
// =============================================================================

export default function AppSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const appId = params.appId as string
    const accountId = params.accountId as string

    const { data: app, isLoading, error } = useApp(appId)
    const updateApp = useUpdateApp(appId)
    const deleteApp = useDeleteApp(appId)
    const regenerateKey = useRegenerateApiKey(appId)
    const healthConfig = useHealthConfig(appId)

    const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)
    const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
        general: true,
        integrations: false,
        health: false,
        danger: false,
    })

    // Handle URL hash for deep linking
    useEffect(() => {
        const hash = window.location.hash.replace('#', '') as SectionKey
        if (hash && ['general', 'integrations', 'health', 'danger'].includes(hash)) {
            setExpandedSections((prev) => ({ ...prev, [hash]: true }))
        }
    }, [])

    const toggleSection = (section: SectionKey) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    const handleUpdateApp = async (data: { name?: string; bundleId?: string }) => {
        await updateApp.mutateAsync(data)
    }

    const handleDelete = async () => {
        await deleteApp.mutateAsync()
        router.push(`/dashboard/${accountId}`)
    }

    const handleRegenerateKey = async () => {
        const result = await regenerateKey.mutateAsync()
        setGeneratedApiKey(result.apiKey)
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
                    Failed to load app settings
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    // Use generated key or app's existing key (may be masked)
    const displayApiKey = generatedApiKey ?? app?.apiKey ?? null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
                <p className="text-neutral-500 mt-1">
                    Manage your app configuration and integrations
                </p>
            </div>

            {/* General Section */}
            <SectionAccordion
                id="general"
                title="General"
                expanded={expandedSections.general}
                onToggle={() => toggleSection('general')}
            >
                <GeneralSettingsSection
                    currentName={app?.name ?? ''}
                    currentBundleId={app?.bundleId ?? null}
                    isLoading={false}
                    isSaving={updateApp.isPending}
                    onSave={handleUpdateApp}
                />

                <ApiKeyManager
                    apiKey={displayApiKey}
                    isLoading={false}
                    isRegenerating={regenerateKey.isPending}
                    onRegenerate={handleRegenerateKey}
                />
            </SectionAccordion>

            {/* Integrations Section */}
            <SectionAccordion
                id="integrations"
                title="Integrations"
                expanded={expandedSections.integrations}
                onToggle={() => toggleSection('integrations')}
            >
                <WebhooksSection accountId={accountId} appId={appId} />
                <AppleCredentialsSection accountId={accountId} appId={appId} />
                <CrashIntegrationsSection accountId={accountId} appId={appId} />
            </SectionAccordion>

            {/* Health Check Section */}
            <SectionAccordion
                id="health"
                title="Health Checks"
                expanded={expandedSections.health}
                onToggle={() => toggleSection('health')}
            >
                <HealthConfigEditor
                    config={healthConfig.config}
                    isLoading={healthConfig.isLoading}
                    isSaving={healthConfig.isSaving}
                    onSave={healthConfig.saveConfig}
                />
            </SectionAccordion>

            {/* Danger Zone Section */}
            <SectionAccordion
                id="danger"
                title="Danger Zone"
                expanded={expandedSections.danger}
                onToggle={() => toggleSection('danger')}
                variant="danger"
            >
                <DangerZoneSection
                    appName={app?.name ?? ''}
                    onDelete={handleDelete}
                    isDeleting={deleteApp.isPending}
                />
            </SectionAccordion>
        </div>
    )
}
