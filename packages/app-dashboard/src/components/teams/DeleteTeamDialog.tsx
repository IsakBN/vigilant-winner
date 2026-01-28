'use client'

/**
 * DeleteTeamDialog Component
 *
 * Confirmation dialog for deleting a team with name confirmation.
 */

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Label,
} from '@bundlenudge/shared-ui'

interface DeleteTeamDialogProps {
    teamName: string
    onConfirm: () => Promise<void>
    isPending: boolean
}

export function DeleteTeamDialog({
    teamName,
    onConfirm,
    isPending,
}: DeleteTeamDialogProps) {
    const [open, setOpen] = useState(false)
    const [confirmName, setConfirmName] = useState('')

    const isConfirmValid = confirmName === teamName

    const handleConfirm = async () => {
        if (!isConfirmValid) return
        await onConfirm()
        setOpen(false)
        setConfirmName('')
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            setConfirmName('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Team
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Team</DialogTitle>
                    <DialogDescription>
                        This will permanently delete &quot;{teamName}&quot; and all
                        associated data. All team members will lose access. This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-4">
                    <Label htmlFor="confirm-name" className="text-sm">
                        Type <span className="font-mono font-semibold">{teamName}</span> to
                        confirm
                    </Label>
                    <Input
                        id="confirm-name"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder={teamName}
                        disabled={isPending}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!isConfirmValid || isPending}
                    >
                        {isPending ? 'Deleting...' : 'Delete Team'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
