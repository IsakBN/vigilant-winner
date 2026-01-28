'use client'

/**
 * AudienceHeader Component
 *
 * Header for the Audience page showing counts.
 */

import { Users } from 'lucide-react'

interface AudienceHeaderProps {
    testerCount: number
    deviceCount: number
}

export function AudienceHeader({ testerCount, deviceCount }: AudienceHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-neutral-100 rounded-lg">
                    <Users className="w-5 h-5 text-neutral-600" />
                </div>
                <h1 className="text-xl font-semibold text-neutral-900">Audience</h1>
            </div>
            <p className="text-sm text-neutral-500 ml-11">
                {testerCount} tester{testerCount !== 1 ? 's' : ''} &bull;{' '}
                {deviceCount} device{deviceCount !== 1 ? 's' : ''} registered
            </p>
        </div>
    )
}
