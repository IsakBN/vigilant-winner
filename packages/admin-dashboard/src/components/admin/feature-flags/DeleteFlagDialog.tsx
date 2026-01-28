'use client'

/**
 * DeleteFlagDialog Component
 *
 * Confirmation dialog for deleting feature flags.
 * Shows flag details and requires explicit confirmation.
 */

import { Loader2, AlertTriangle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
} from '@bundlenudge/shared-ui'
import type { FeatureFlag } from '@/lib/api/types'

export interface DeleteFlagDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    flag: FeatureFlag | null
    onConfirm: () => void
    isDeleting: boolean
}

export function DeleteFlagDialog({
    open,
    onOpenChange,
    flag,
    onConfirm,
    isDeleting,
}: DeleteFlagDialogProps) {
    if (!flag) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-destructive/10 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <DialogTitle>Delete Feature Flag</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        Are you sure you want to delete this feature flag? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-text-light">Name:</span>
                        <span className="font-medium">{flag.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-light">Key:</span>
                        <code className="text-xs bg-background px-1.5 py-0.5 rounded">
                            {flag.key}
                        </code>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-light">Status:</span>
                        <span className={flag.enabled ? 'text-green-600' : 'text-text-light'}>
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Delete Flag
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
