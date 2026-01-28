'use client'

/**
 * EmptyTesterState Component
 *
 * Empty state for when no testers exist.
 */

import { Users } from 'lucide-react'
import { Card, CardContent } from '@bundlenudge/shared-ui'
import { AddTesterDialog } from './AddTesterDialog'

interface EmptyTesterStateProps {
    onAdd: (email: string, name?: string) => Promise<void>
    isSubmitting: boolean
}

export function EmptyTesterState({ onAdd, isSubmitting }: EmptyTesterStateProps) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">No testers yet</h3>
                <p className="text-sm text-neutral-500 mb-4">
                    Add testers to notify them when new builds are ready.
                </p>
                <AddTesterDialog onAdd={onAdd} isSubmitting={isSubmitting} />
            </CardContent>
        </Card>
    )
}
