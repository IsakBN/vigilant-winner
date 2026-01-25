/**
 * Apps Section Layout
 *
 * Wrapper layout for all apps-related pages.
 */

import type { ReactNode } from 'react'

interface AppsLayoutProps {
    children: ReactNode
}

export default function AppsLayout({ children }: AppsLayoutProps) {
    return (
        <div className="min-h-screen bg-cream-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>
        </div>
    )
}
