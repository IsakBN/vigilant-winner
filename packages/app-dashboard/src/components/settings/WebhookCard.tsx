'use client'

/**
 * WebhookCard Component
 *
 * Displays a single webhook with actions.
 */

import {
    Button,
    Badge,
    Switch,
    Card,
    CardContent,
} from '@bundlenudge/shared-ui'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash, PlayCircle } from 'lucide-react'
import type { Webhook } from '@/lib/api/webhooks'

interface WebhookCardProps {
    webhook: Webhook
    onEdit: () => void
    onDelete: () => void
    onTest: () => void
    onToggle: () => void
    isTestLoading: boolean
}

export function WebhookCard({
    webhook,
    onEdit,
    onDelete,
    onTest,
    onToggle,
    isTestLoading,
}: WebhookCardProps) {
    const lastTriggered = webhook.lastTriggeredAt
        ? new Date(webhook.lastTriggeredAt * 1000).toLocaleDateString()
        : 'Never'

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium">{webhook.name}</h3>
                            <Badge
                                variant={
                                    webhook.enabled ? 'default' : 'secondary'
                                }
                            >
                                {webhook.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                            {webhook.failureCount > 0 && (
                                <Badge variant="destructive">
                                    {webhook.failureCount} failures
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {webhook.url}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {webhook.events.map((event) => (
                                <Badge key={event} variant="outline">
                                    {event}
                                </Badge>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Last triggered: {lastTriggered}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={webhook.enabled}
                            onCheckedChange={onToggle}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={onTest}
                                    disabled={isTestLoading}
                                >
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Test
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="text-destructive"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
