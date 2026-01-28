'use client'

/**
 * DangerZoneSection Component
 *
 * Handles destructive app actions like deletion.
 */

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// =============================================================================
// Types
// =============================================================================

interface DangerZoneSectionProps {
    appName: string
    onDelete: () => Promise<void>
    isDeleting: boolean
}

// =============================================================================
// Component
// =============================================================================

export function DangerZoneSection({
    appName,
    onDelete,
    isDeleting,
}: DangerZoneSectionProps) {
    const [confirmText, setConfirmText] = useState('')
    const [showDialog, setShowDialog] = useState(false)

    const handleDelete = async () => {
        if (confirmText !== appName) return
        await onDelete()
    }

    return (
        <Card className="border-red-200">
            <CardHeader>
                <CardTitle className="text-lg text-red-700">Danger Zone</CardTitle>
                <p className="text-sm text-neutral-500 mt-1">
                    Irreversible actions that will permanently affect your app.
                </p>
            </CardHeader>
            <CardContent>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h4 className="font-medium text-neutral-900">Delete this app</h4>
                        <p className="text-sm text-neutral-500 mt-1">
                            Once deleted, all releases, devices, and data will be permanently
                            removed. This action cannot be undone.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDialog(true)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete App
                    </Button>
                </div>

                <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                                <p>
                                    This will permanently delete{' '}
                                    <strong>{appName}</strong> and all of its data:
                                </p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    <li>All releases and their bundles</li>
                                    <li>Device registrations and analytics</li>
                                    <li>API keys and configurations</li>
                                    <li>Webhooks and integrations</li>
                                </ul>
                                <p>
                                    Type <strong>{appName}</strong> to confirm.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-4">
                            <Input
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={appName}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmText('')}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={confirmText !== appName || isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete App'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
