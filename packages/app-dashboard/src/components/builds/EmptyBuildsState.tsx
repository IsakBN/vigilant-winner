'use client'

/**
 * EmptyBuildsState Component
 *
 * Empty state displayed when there are no builds for an app.
 */

import Link from 'next/link'
import { Hammer, Upload } from 'lucide-react'
import { Card, CardContent, Button } from '@bundlenudge/shared-ui'

interface EmptyBuildsStateProps {
    accountId: string
    appId: string
}

export function EmptyBuildsState({ accountId, appId }: EmptyBuildsStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
                    <Hammer className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    No builds yet
                </h3>
                <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">
                    Upload a bundle or trigger a build to create your first build.
                </p>
                <Button asChild>
                    <Link href={`/dashboard/${accountId}/apps/${appId}/builds/new`}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Bundle
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
