'use client'

/**
 * EmptyReleasesState Component
 *
 * Empty state displayed when no releases exist for an app.
 */

import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import { Card, CardContent, Button } from '@bundlenudge/shared-ui'

interface EmptyReleasesStateProps {
    accountId: string
    appId: string
}

export function EmptyReleasesState({ accountId, appId }: EmptyReleasesStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
                    <Package className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    No releases yet
                </h3>
                <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">
                    Create your first release to start shipping updates.
                </p>
                <Button asChild>
                    <Link href={`/dashboard/${accountId}/apps/${appId}/releases/new`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Release
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
