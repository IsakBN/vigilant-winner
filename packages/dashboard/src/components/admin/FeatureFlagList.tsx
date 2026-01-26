'use client'

/**
 * FeatureFlagList Component
 *
 * Displays a list of feature flags with toggle controls and quick actions.
 */

import { useCallback } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Badge,
    Button,
    Switch,
    Skeleton,
    useToast,
} from '@/components/ui'
import { useFeatureFlags, useFeatureFlagActions } from '@/hooks/useAdmin'
import type { FeatureFlag } from '@/lib/api'

interface FeatureFlagListProps {
    onEditFlag?: (flag: FeatureFlag) => void
    onCreateFlag?: () => void
}

export function FeatureFlagList({ onEditFlag, onCreateFlag }: FeatureFlagListProps) {
    const { flags, isLoading, isError, error } = useFeatureFlags()
    const { toggleFlag, deleteFlag } = useFeatureFlagActions()
    const { toast } = useToast()

    const handleToggle = useCallback(
        (flag: FeatureFlag, enabled: boolean) => {
            toggleFlag.mutate(
                { flagId: flag.id, enabled },
                {
                    onSuccess: () => {
                        toast({
                            title: enabled ? 'Flag enabled' : 'Flag disabled',
                            description: `"${flag.name}" has been ${enabled ? 'enabled' : 'disabled'}.`,
                        })
                    },
                    onError: (err) => {
                        toast({
                            title: 'Error',
                            description: err.message,
                            variant: 'error',
                        })
                    },
                }
            )
        },
        [toggleFlag, toast]
    )

    const handleDelete = useCallback(
        (flag: FeatureFlag) => {
            if (!confirm(`Delete "${flag.name}"? This cannot be undone.`)) return

            deleteFlag.mutate(flag.id, {
                onSuccess: () => {
                    toast({
                        title: 'Flag deleted',
                        description: `"${flag.name}" has been deleted.`,
                    })
                },
                onError: (err) => {
                    toast({
                        title: 'Error',
                        description: err.message,
                        variant: 'error',
                    })
                },
            })
        },
        [deleteFlag, toast]
    )

    if (isLoading) {
        return <FeatureFlagListSkeleton />
    }

    if (isError) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive">
                    Failed to load feature flags: {error?.message}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                    {flags.length} feature flag{flags.length !== 1 ? 's' : ''}
                </p>
                {onCreateFlag && (
                    <Button onClick={onCreateFlag}>Create Flag</Button>
                )}
            </div>

            {/* Flag List */}
            {flags.length === 0 ? (
                <EmptyState onCreateFlag={onCreateFlag} />
            ) : (
                <div className="grid gap-4">
                    {flags.map((flag) => (
                        <FeatureFlagCard
                            key={flag.id}
                            flag={flag}
                            onToggle={handleToggle}
                            onEdit={onEditFlag}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface FeatureFlagCardProps {
    flag: FeatureFlag
    onToggle: (flag: FeatureFlag, enabled: boolean) => void
    onEdit?: (flag: FeatureFlag) => void
    onDelete: (flag: FeatureFlag) => void
}

function FeatureFlagCard({ flag, onToggle, onEdit, onDelete }: FeatureFlagCardProps) {
    const handleToggleChange = useCallback(
        (checked: boolean) => {
            onToggle(flag, checked)
        },
        [flag, onToggle]
    )

    const handleEditClick = useCallback(() => {
        onEdit?.(flag)
    }, [flag, onEdit])

    const handleDeleteClick = useCallback(() => {
        onDelete(flag)
    }, [flag, onDelete])

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{flag.name}</CardTitle>
                            <TypeBadge type={flag.type} />
                        </div>
                        <code className="text-sm text-muted-foreground font-mono">
                            {flag.key}
                        </code>
                    </div>
                    <Switch
                        checked={flag.enabled}
                        onCheckedChange={handleToggleChange}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {flag.description && (
                    <CardDescription className="mb-4">
                        {flag.description}
                    </CardDescription>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                    {flag.type === 'percentage' && (
                        <RolloutInfo percentage={flag.rolloutPercentage} />
                    )}
                    {flag.targetPlanTypes.length > 0 && (
                        <TargetPlansInfo plans={flag.targetPlanTypes} />
                    )}
                    {flag.targetOrgIds.length > 0 && (
                        <TargetOrgsInfo count={flag.targetOrgIds.length} />
                    )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                    {onEdit && (
                        <Button variant="outline" size="sm" onClick={handleEditClick}>
                            Edit
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteClick}
                        className="text-destructive hover:text-destructive"
                    >
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function TypeBadge({ type }: { type: FeatureFlag['type'] }) {
    const variants: Record<FeatureFlag['type'], 'default' | 'secondary' | 'outline'> = {
        boolean: 'outline',
        percentage: 'secondary',
        json: 'default',
    }

    return <Badge variant={variants[type]}>{type}</Badge>
}

function RolloutInfo({ percentage }: { percentage: number }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Rollout:</span>
            <span className="font-medium">{percentage}%</span>
        </div>
    )
}

function TargetPlansInfo({ plans }: { plans: string[] }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Plans:</span>
            <span className="font-medium">{plans.join(', ')}</span>
        </div>
    )
}

function TargetOrgsInfo({ count }: { count: number }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Target orgs:</span>
            <span className="font-medium">{count}</span>
        </div>
    )
}

function EmptyState({ onCreateFlag }: { onCreateFlag?: () => void }) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <h3 className="text-lg font-medium mb-2">No feature flags</h3>
                <p className="text-muted-foreground mb-4">
                    Create your first feature flag to control feature rollouts.
                </p>
                {onCreateFlag && (
                    <Button onClick={onCreateFlag}>Create Flag</Button>
                )}
            </CardContent>
        </Card>
    )
}

function FeatureFlagListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-28" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-6 w-10" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-4 w-48" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
