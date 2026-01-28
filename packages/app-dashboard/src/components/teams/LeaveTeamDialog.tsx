'use client'

/**
 * LeaveTeamDialog Component
 *
 * Confirmation dialog for leaving a team.
 */

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@bundlenudge/shared-ui'

interface LeaveTeamDialogProps {
    teamName: string
    onConfirm: () => Promise<void>
    isPending: boolean
}

export function LeaveTeamDialog({
    teamName,
    onConfirm,
    isPending,
}: LeaveTeamDialogProps) {
    const [open, setOpen] = useState(false)

    const handleConfirm = async () => {
        await onConfirm()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Team
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave Team</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to leave &quot;{teamName}&quot;? You will lose
                        access to all team resources and will need to be re-invited to
                        rejoin.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isPending}
                    >
                        {isPending ? 'Leaving...' : 'Leave Team'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
