'use client'

/**
 * AppDetailModal Component
 *
 * Modal displaying detailed app information with admin actions:
 * - Overview tab: app info, org, stats
 * - Actions tab: disable/enable, delete
 */

import { useState, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Badge,
    Skeleton,
    Label,
    Input,
} from '@bundlenudge/shared-ui'
import { useAdminOpsApp, useUpdateAppStatus, useDeleteAdminApp } from '@/hooks/useAdminOps'

export interface AppDetailModalProps {
    appId: string | null
    open: boolean
    onClose: () => void
    onAppUpdated?: () => void
}

export function AppDetailModal({
    appId,
    open,
    onClose,
    onAppUpdated,
}: AppDetailModalProps) {
    const { data: app, isLoading, error } = useAdminOpsApp(appId ?? '')
    const updateStatus = useUpdateAppStatus()
    const deleteApp = useDeleteAdminApp()

    const [showDisable, setShowDisable] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    // Form values
    const [deleteConfirmName, setDeleteConfirmName] = useState('')

    // Reset form state when modal closes
    useEffect(() => {
        if (!open) {
            setShowDisable(false)
            setShowDelete(false)
            setDeleteConfirmName('')
            setActionError(null)
        }
    }, [open])

    const handleToggleStatus = useCallback(async () => {
        if (!app) return
        const newStatus = app.status === 'active' ? 'disabled' : 'active'

        try {
            setActionError(null)
            await updateStatus.mutateAsync({ appId: app.id, status: newStatus })
            setShowDisable(false)
            onAppUpdated?.()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Failed to update status')
        }
    }, [app, updateStatus, onAppUpdated])

    const handleDeleteApp = useCallback(async () => {
        if (deleteConfirmName !== app?.name) return

        try {
            setActionError(null)
            await deleteApp.mutateAsync(app.id)
            setShowDelete(false)
            setDeleteConfirmName('')
            onAppUpdated?.()
            onClose()
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Failed to delete app')
        }
    }, [app, deleteConfirmName, deleteApp, onAppUpdated, onClose])

    const handleClose = useCallback(() => {
        setShowDisable(false)
        setShowDelete(false)
        setDeleteConfirmName('')
        setActionError(null)
        onClose()
    }, [onClose])

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>App Details</DialogTitle>
                    <DialogDescription>
                        {app?.name ?? 'Loading...'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error instanceof Error ? error.message : 'Failed to load app'}
                    </div>
                )}

                {actionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {actionError}
                    </div>
                )}

                {isLoading ? (
                    <AppDetailSkeleton />
                ) : app ? (
                    <div className="space-y-6">
                        {/* Status Banner */}
                        {app.status === 'disabled' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <Badge className="bg-red-100 text-red-700">Disabled</Badge>
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="App Name" value={app.name} />
                            <InfoItem label="Organization" value={app.orgName} />
                            <InfoItem label="Platform" value={formatPlatform(app.platform)} />
                            <InfoItem
                                label="Status"
                                value={
                                    <Badge className={app.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }>
                                        {app.status === 'active' ? 'Active' : 'Disabled'}
                                    </Badge>
                                }
                            />
                            <InfoItem label="Created" value={formatDate(app.createdAt)} />
                            <InfoItem
                                label="Last Update"
                                value={app.lastUpdate ? formatDate(app.lastUpdate) : 'Never'}
                            />
                        </div>

                        {/* Stats */}
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Statistics</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Total Bundles" value={String(app.bundleCount)} />
                                <InfoItem label="Total Downloads" value={formatNumber(app.totalDownloads)} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <h4 className="font-medium">Actions</h4>

                            {/* Toggle Status */}
                            <ActionCard
                                title={app.status === 'active' ? 'Disable App' : 'Enable App'}
                                description={app.status === 'active'
                                    ? 'Prevent this app from serving OTA updates.'
                                    : 'Re-enable this app to resume serving OTA updates.'
                                }
                                variant={app.status === 'active' ? 'warning' : 'default'}
                            >
                                {showDisable ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            {app.status === 'active'
                                                ? 'This will prevent the app from serving updates.'
                                                : 'This will re-enable the app.'}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowDisable(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant={app.status === 'active' ? 'destructive' : 'default'}
                                                onClick={handleToggleStatus}
                                                disabled={updateStatus.isPending}
                                            >
                                                {app.status === 'active' ? 'Disable App' : 'Enable App'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant={app.status === 'active' ? 'outline' : 'default'}
                                        onClick={() => setShowDisable(true)}
                                    >
                                        {app.status === 'active' ? 'Disable App' : 'Enable App'}
                                    </Button>
                                )}
                            </ActionCard>

                            {/* Delete App */}
                            <ActionCard
                                title="Delete App"
                                description="Permanently delete this app and all associated data."
                                variant="danger"
                            >
                                {showDelete ? (
                                    <div className="space-y-3">
                                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800">
                                            <strong>Warning:</strong> This action CANNOT be undone.
                                        </div>
                                        <div>
                                            <Label>Type the app name to confirm:</Label>
                                            <Input
                                                value={deleteConfirmName}
                                                onChange={(e) => setDeleteConfirmName(e.target.value)}
                                                placeholder={app.name}
                                                className="font-mono"
                                            />
                                            {deleteConfirmName && deleteConfirmName !== app.name && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    Name does not match
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowDelete(false)
                                                    setDeleteConfirmName('')
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={handleDeleteApp}
                                                disabled={deleteConfirmName !== app.name || deleteApp.isPending}
                                            >
                                                Delete App
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="destructive" onClick={() => setShowDelete(true)}>
                                        Delete App
                                    </Button>
                                )}
                            </ActionCard>
                        </div>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// =============================================================================
// Sub-components
// =============================================================================

interface InfoItemProps {
    label: string
    value: React.ReactNode
}

function InfoItem({ label, value }: InfoItemProps) {
    return (
        <div>
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="text-sm font-medium">{value}</div>
        </div>
    )
}

interface ActionCardProps {
    title: string
    description: string
    variant?: 'default' | 'warning' | 'danger'
    children: React.ReactNode
}

function ActionCard({ title, description, variant = 'default', children }: ActionCardProps) {
    const variantClasses = {
        default: 'border rounded-lg p-4',
        warning: 'border border-yellow-200 bg-yellow-50 rounded-lg p-4',
        danger: 'border border-red-200 bg-red-50 rounded-lg p-4',
    }

    const titleClasses = {
        default: 'font-medium mb-2',
        warning: 'font-medium mb-2 text-yellow-800',
        danger: 'font-medium mb-2 text-red-800',
    }

    const descClasses = {
        default: 'text-sm text-muted-foreground mb-3',
        warning: 'text-sm text-yellow-700 mb-3',
        danger: 'text-sm text-red-700 mb-3',
    }

    return (
        <div className={variantClasses[variant]}>
            <h5 className={titleClasses[variant]}>{title}</h5>
            <p className={descClasses[variant]}>{description}</p>
            {children}
        </div>
    )
}

function AppDetailSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    )
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
}

function formatPlatform(platform: string): string {
    switch (platform) {
        case 'ios':
            return 'iOS'
        case 'android':
            return 'Android'
        case 'both':
            return 'iOS & Android'
        default:
            return platform
    }
}
