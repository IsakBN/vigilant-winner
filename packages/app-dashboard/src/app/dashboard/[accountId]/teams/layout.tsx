/**
 * Teams Section Layout
 *
 * Wrapper layout for all team-related pages.
 */

import type { ReactNode } from 'react'

interface TeamsLayoutProps {
    children: ReactNode
}

export default function TeamsLayout({ children }: TeamsLayoutProps) {
    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>
        </div>
    )
}
