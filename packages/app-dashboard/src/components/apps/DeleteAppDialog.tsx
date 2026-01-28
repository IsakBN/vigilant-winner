'use client'

/**
 * DeleteAppDialog Component
 *
 * Confirmation dialog for deleting an app with name confirmation.
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

interface DeleteAppDialogProps {
    appName: string
    onConfirm: () => Promise<void>
    isPending: boolean
}

export function DeleteAppDialog({
    appName,
    onConfirm,
    isPending,
}: DeleteAppDialogProps) {
    const [open, setOpen] = useState(false)
    const [confirmName, setConfirmName] = useState('')

    const isConfirmValid = confirmName === appName

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
                    Delete App
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete App</DialogTitle>
                    <DialogDescription>
                        This will permanently delete &quot;{appName}&quot; and all
                        associated data including:
                    </DialogDescription>
                </DialogHeader>

                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 my-2">
                    <li>All releases and their bundles</li>
                    <li>Device registrations and analytics</li>
                    <li>API keys and configurations</li>
                    <li>Channels and targeting rules</li>
                </ul>

                <p className="text-sm text-muted-foreground">
                    This action cannot be undone.
                </p>

                <div className="space-y-2 py-4">
                    <Label htmlFor="confirm-name" className="text-sm">
                        Type <span className="font-mono font-semibold">{appName}</span> to
                        confirm
                    </Label>
                    <Input
                        id="confirm-name"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder={appName}
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
                        {isPending ? 'Deleting...' : 'Delete App'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
