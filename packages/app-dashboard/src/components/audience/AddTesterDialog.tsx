'use client'

/**
 * AddTesterDialog Component
 *
 * Dialog for adding a single tester.
 */

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
    Button,
    Input,
    Label,
} from '@bundlenudge/shared-ui'

interface AddTesterDialogProps {
    onAdd: (email: string, name?: string) => Promise<void>
    isSubmitting: boolean
}

export function AddTesterDialog({ onAdd, isSubmitting }: AddTesterDialogProps) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return

        await onAdd(email.trim(), name.trim() || undefined)
        setEmail('')
        setName('')
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Tester</Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={(e) => void handleSubmit(e)}>
                    <DialogHeader>
                        <DialogTitle>Add Tester</DialogTitle>
                        <DialogDescription>
                            Add a tester to receive build notifications
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tester@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !email.trim()}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Tester'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
