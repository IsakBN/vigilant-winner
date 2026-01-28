'use client'

/**
 * Settings Layout
 *
 * Provides tab navigation for settings pages.
 */

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from '@bundlenudge/shared-ui'

const SETTINGS_TABS = [
    { href: '', label: 'Profile' },
    { href: '/billing', label: 'Billing' },
    { href: '/usage', label: 'Usage' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/webhooks', label: 'Webhooks' },
]

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const params = useParams()
    const pathname = usePathname()
    const accountId = params.accountId as string
    const basePath = `/dashboard/${accountId}/settings`

    const isActive = (href: string) => {
        const fullPath = `${basePath}${href}`
        if (href === '') {
            return pathname === basePath
        }
        return pathname === fullPath || pathname.startsWith(`${fullPath}/`)
    }

    return (
        <div className="p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="mt-1 text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <nav className="mb-6 flex space-x-1 border-b">
                {SETTINGS_TABS.map((tab) => (
                    <Link
                        key={tab.href}
                        href={`${basePath}${tab.href}`}
                        className={cn(
                            'px-4 py-2 text-sm font-medium transition-colors',
                            'border-b-2 -mb-px',
                            isActive(tab.href)
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>

            {children}
        </div>
    )
}
