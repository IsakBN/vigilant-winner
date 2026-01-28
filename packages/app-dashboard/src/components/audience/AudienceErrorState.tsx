'use client'

/**
 * AudienceErrorState Component
 *
 * Error state for audience-related failures.
 */

import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@bundlenudge/shared-ui'

interface AudienceErrorStateProps {
    message: string
}

export function AudienceErrorState({ message }: AudienceErrorStateProps) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{message}</h3>
                <p className="text-sm text-neutral-500">
                    Please try again or contact support if the issue persists.
                </p>
            </CardContent>
        </Card>
    )
}
