'use client'

/**
 * BulkImportDialog Component
 *
 * Dialog for bulk importing testers from CSV.
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
    Textarea,
} from '@bundlenudge/shared-ui'

interface BulkImportDialogProps {
    onImport: (csv: string) => Promise<void>
    isSubmitting: boolean
}

export function BulkImportDialog({ onImport, isSubmitting }: BulkImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [csv, setCsv] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!csv.trim()) return

        await onImport(csv)
        setCsv('')
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Bulk Import</Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={(e) => void handleSubmit(e)}>
                    <DialogHeader>
                        <DialogTitle>Bulk Import Testers</DialogTitle>
                        <DialogDescription>
                            Paste tester emails, one per line. Format: email, name (name
                            optional)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            className="h-48 font-mono text-sm"
                            placeholder={`john@example.com, John Doe\njane@example.com\ntest@company.com, Test User`}
                            value={csv}
                            onChange={(e) => setCsv(e.target.value)}
                        />
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
                            disabled={isSubmitting || !csv.trim()}
                        >
                            {isSubmitting ? 'Importing...' : 'Import'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
