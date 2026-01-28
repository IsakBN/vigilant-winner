'use client'

/**
 * WebhooksEmptyState Component
 *
 * Empty state displayed when no webhooks are configured.
 */

import {
    Button,
    Card,
    CardContent,
} from '@bundlenudge/shared-ui'
import { Plus } from 'lucide-react'

interface WebhooksEmptyStateProps {
    onAdd: () => void
}

export function WebhooksEmptyState({ onAdd }: WebhooksEmptyStateProps) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                    No webhooks configured yet
                </p>
                <Button className="mt-4" onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Webhook
                </Button>
            </CardContent>
        </Card>
    )
}
