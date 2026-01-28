'use client'

/**
 * NewsletterStats Component
 *
 * Displays stats cards for newsletter overview:
 * - Total subscribers
 * - Active subscribers
 * - Recent signups (last 7 days)
 * - Unsubscribed count
 */

import { Users, UserCheck, UserPlus, UserMinus } from 'lucide-react'
import { Card, CardContent, Skeleton } from '@bundlenudge/shared-ui'
import type { Pagination } from '@/lib/api/types'

export interface NewsletterStatsProps {
    pagination: Pagination
    activeCount: number
    recentSignups: number
    isLoading: boolean
}

export function NewsletterStats({
    pagination,
    activeCount,
    recentSignups,
    isLoading,
}: NewsletterStatsProps) {
    if (isLoading) {
        return <NewsletterStatsSkeleton />
    }

    const inactiveCount = pagination.total - activeCount

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Subscribers"
                value={pagination.total}
                icon={<Users className="w-5 h-5" />}
                color="blue"
            />
            <StatCard
                title="Active Subscribers"
                value={activeCount}
                icon={<UserCheck className="w-5 h-5" />}
                color="green"
            />
            <StatCard
                title="Recent Signups"
                value={recentSignups}
                subtitle="Last 7 days"
                icon={<UserPlus className="w-5 h-5" />}
                color="purple"
            />
            <StatCard
                title="Unsubscribed"
                value={inactiveCount}
                icon={<UserMinus className="w-5 h-5" />}
                color="gray"
            />
        </div>
    )
}

interface StatCardProps {
    title: string
    value: number
    subtitle?: string
    icon: React.ReactNode
    color: 'blue' | 'green' | 'purple' | 'gray'
}

const COLOR_CLASSES = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${COLOR_CLASSES[color]}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm text-text-light">{title}</p>
                        <p className="text-2xl font-bold text-text-dark">
                            {value.toLocaleString()}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-text-light">{subtitle}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function NewsletterStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <div>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-7 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
