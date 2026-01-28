'use client'

/**
 * BuildTimeline Component
 *
 * Shows build progress through steps: queued -> building -> uploading -> complete.
 */

import { CheckCircle, Clock, Loader2, XCircle, Ban } from 'lucide-react'
import { cn } from '@bundlenudge/shared-ui'
import type { BuildStatus } from '@/lib/api/builds'

interface BuildTimelineProps {
    status: BuildStatus
    className?: string
}

type StepStatus = 'completed' | 'active' | 'pending' | 'failed' | 'cancelled'

interface Step {
    id: string
    label: string
    getStatus: (buildStatus: BuildStatus) => StepStatus
}

const STEPS: Step[] = [
    {
        id: 'queued',
        label: 'Queued',
        getStatus: (status) => {
            if (status === 'cancelled') return 'cancelled'
            if (status === 'queued') return 'active'
            return 'completed'
        },
    },
    {
        id: 'building',
        label: 'Building',
        getStatus: (status) => {
            if (status === 'cancelled') return 'cancelled'
            if (status === 'queued') return 'pending'
            if (status === 'processing') return 'active'
            if (status === 'failed') return 'failed'
            return 'completed'
        },
    },
    {
        id: 'uploading',
        label: 'Uploading',
        getStatus: (status) => {
            if (status === 'cancelled') return 'cancelled'
            if (status === 'queued' || status === 'processing') return 'pending'
            if (status === 'failed') return 'failed'
            return 'completed'
        },
    },
    {
        id: 'complete',
        label: 'Complete',
        getStatus: (status) => {
            if (status === 'cancelled') return 'cancelled'
            if (status === 'failed') return 'failed'
            if (status === 'completed') return 'completed'
            return 'pending'
        },
    },
]

function getStepIcon(stepStatus: StepStatus) {
    switch (stepStatus) {
        case 'completed':
            return <CheckCircle className="w-5 h-5 text-green-600" />
        case 'active':
            return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        case 'failed':
            return <XCircle className="w-5 h-5 text-red-600" />
        case 'cancelled':
            return <Ban className="w-5 h-5 text-neutral-400" />
        default:
            return <Clock className="w-5 h-5 text-neutral-300" />
    }
}

function getStepColors(stepStatus: StepStatus) {
    switch (stepStatus) {
        case 'completed':
            return {
                circle: 'border-green-600 bg-green-50',
                line: 'bg-green-600',
                label: 'text-green-700',
            }
        case 'active':
            return {
                circle: 'border-blue-600 bg-blue-50',
                line: 'bg-neutral-200',
                label: 'text-blue-700 font-medium',
            }
        case 'failed':
            return {
                circle: 'border-red-600 bg-red-50',
                line: 'bg-red-200',
                label: 'text-red-700',
            }
        case 'cancelled':
            return {
                circle: 'border-neutral-300 bg-neutral-50',
                line: 'bg-neutral-200',
                label: 'text-neutral-400',
            }
        default:
            return {
                circle: 'border-neutral-200 bg-white',
                line: 'bg-neutral-200',
                label: 'text-neutral-400',
            }
    }
}

export function BuildTimeline({ status, className }: BuildTimelineProps) {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            {STEPS.map((step, index) => {
                const stepStatus = step.getStatus(status)
                const colors = getStepColors(stepStatus)
                const isLast = index === STEPS.length - 1

                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-full border-2 flex items-center justify-center',
                                    colors.circle
                                )}
                            >
                                {getStepIcon(stepStatus)}
                            </div>
                            <span className={cn('mt-2 text-xs', colors.label)}>
                                {step.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                className={cn(
                                    'flex-1 h-0.5 mx-2',
                                    colors.line
                                )}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
