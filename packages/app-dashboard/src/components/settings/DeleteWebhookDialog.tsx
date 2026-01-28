'use client'

/**
 * DeleteWebhookDialog Component
 *
 * Confirmation dialog for deleting a webhook.
 */

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Webhook } from '@/lib/api/webhooks'

interface DeleteWebhookDialogProps {
    webhook: Webhook | null
    isDeleting: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function DeleteWebhookDialog({
    webhook,
    isDeleting,
    onConfirm,
    onCancel,
}: DeleteWebhookDialogProps) {
    return (
        <AlertDialog open={Boolean(webhook)} onOpenChange={onCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{webhook?.name}
                        &quot;? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive text-destructive-foreground"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
