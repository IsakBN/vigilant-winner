'use client'

/**
 * RollbackSummaryCard - Summary stat card for rollback reports.
 */

import { Card, CardContent, cn } from '@bundlenudge/shared-ui'

interface RollbackSummaryCardProps {
    label: string
    value: string | number
    icon: React.ReactNode
    variant?: 'default' | 'success' | 'warning' | 'error'
}

const iconColors = {
    default: 'text-neutral-500 bg-neutral-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-amber-600 bg-amber-100',
    error: 'text-red-600 bg-red-100',
}

export function RollbackSummaryCard({
    label,
    value,
    icon,
    variant = 'default',
}: RollbackSummaryCardProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg',
                        iconColors[variant]
                    )}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-neutral-900">{value}</p>
                        <p className="text-sm text-neutral-500">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
