'use client'

/**
 * BuildErrorCard Component
 *
 * Displays error message when a build fails.
 */

import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, cn } from '@bundlenudge/shared-ui'

interface BuildErrorCardProps {
    errorMessage: string
    className?: string
}

export function BuildErrorCard({ errorMessage, className }: BuildErrorCardProps) {
    return (
        <Card className={cn('border-red-200 bg-red-50', className)}>
            <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Build Failed
                </h3>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-red-600 font-mono whitespace-pre-wrap">
                    {errorMessage}
                </p>
            </CardContent>
        </Card>
    )
}
