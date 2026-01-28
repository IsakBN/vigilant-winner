'use client'

/**
 * AuditLogDetailModal Component
 *
 * Modal to display detailed information about an audit log entry.
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Badge,
} from '@bundlenudge/shared-ui'
import type { AuditLogEntry, AuditAction } from '@/lib/api'

interface AuditLogDetailModalProps {
    log: AuditLogEntry | null
    open: boolean
    onClose: () => void
}

/**
 * Format action for display
 */
function formatAction(action: AuditAction): string {
    const actionMap: Record<AuditAction, string> = {
        'config.update': 'Config Updated',
        'user.create': 'User Created',
        'user.update': 'User Updated',
        'user.delete': 'User Deleted',
        'user.suspend': 'User Suspended',
        'user.unsuspend': 'User Unsuspended',
        'app.create': 'App Created',
        'app.delete': 'App Deleted',
        'release.create': 'Release Created',
        'release.rollback': 'Release Rollback',
        'team.create': 'Team Created',
        'team.delete': 'Team Deleted',
        'admin.login': 'Admin Login',
        'admin.logout': 'Admin Logout',
    }
    return actionMap[action] || action
}

/**
 * Get badge variant based on action type
 */
function getActionVariant(
    action: AuditAction
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (action.includes('delete') || action.includes('suspend')) {
        return 'destructive'
    }
    if (action.includes('create')) {
        return 'default'
    }
    if (action.includes('login') || action.includes('logout')) {
        return 'secondary'
    }
    return 'outline'
}

/**
 * Format date for display
 */
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

interface DetailRowProps {
    label: string
    value: string | null | undefined
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm">{value || '-'}</span>
        </div>
    )
}

export function AuditLogDetailModal({
    log,
    open,
    onClose,
}: AuditLogDetailModalProps) {
    if (!log) return null

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        Audit Log Details
                        <Badge variant={getActionVariant(log.action)}>
                            {formatAction(log.action)}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Log ID" value={log.id} />
                        <DetailRow label="Date" value={formatDate(log.createdAt)} />
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Actor Information</h4>
                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                            <DetailRow label="Name" value={log.actorName} />
                            <DetailRow label="Email" value={log.actorEmail} />
                            <DetailRow label="Actor ID" value={log.actorId} />
                            <DetailRow label="IP Address" value={log.ipAddress} />
                        </div>
                    </div>

                    {log.targetType && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Target Information</h4>
                            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                                <DetailRow label="Type" value={log.targetType} />
                                <DetailRow label="Name" value={log.targetName} />
                                <DetailRow label="ID" value={log.targetId} />
                            </div>
                        </div>
                    )}

                    {log.userAgent && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">User Agent</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg break-all">
                                {log.userAgent}
                            </p>
                        </div>
                    )}

                    {Object.keys(log.metadata).length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Metadata</h4>
                            <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-48">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
