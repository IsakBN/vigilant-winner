'use client'

/**
 * RemoveMemberDialog Component
 *
 * Confirmation dialog for removing a team member.
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
} from '@bundlenudge/shared-ui'

interface RemoveMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    memberName: string
    onConfirm: () => void
    isLoading?: boolean
}

export function RemoveMemberDialog({
    open,
    onOpenChange,
    memberName,
    onConfirm,
    isLoading,
}: RemoveMemberDialogProps) {
    const handleConfirm = () => {
        onConfirm()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove Member</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove{' '}
                        <span className="font-medium text-foreground">{memberName}</span>{' '}
                        from the team? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Removing...' : 'Remove'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
