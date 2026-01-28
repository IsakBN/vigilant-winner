'use client'

/**
 * RevokeDeviceDialog Component
 *
 * Confirmation dialog for revoking a device's access.
 */

import { useState } from 'react'
import { Ban } from 'lucide-react'
import {
    Button,
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@bundlenudge/shared-ui'

interface RevokeDeviceDialogProps {
    onConfirm: () => Promise<void>
    isPending: boolean
}

export function RevokeDeviceDialog({ onConfirm, isPending }: RevokeDeviceDialogProps) {
    const [open, setOpen] = useState(false)

    const handleConfirm = async () => {
        await onConfirm()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Ban className="w-4 h-4 mr-2" />
                    Revoke Access
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Revoke Device Access</DialogTitle>
                    <DialogDescription>
                        This will revoke the device&apos;s access token and prevent it from
                        receiving updates. The device will need to re-register to receive
                        updates again.
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
                        {isPending ? 'Revoking...' : 'Revoke Access'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
