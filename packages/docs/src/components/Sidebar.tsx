'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const navigation = [
  {
    title: 'Getting Started',
    items: [
      { title: 'What is BundleNudge?', href: '/getting-started/what-is-bundlenudge' },
      { title: 'Quickstart', href: '/getting-started/quickstart' },
      { title: 'Concepts', href: '/getting-started/concepts' },
    ],
  },
  {
    title: 'SDK',
    items: [
      { title: 'Installation', href: '/sdk/installation' },
      { title: 'Configuration', href: '/sdk/configuration' },
      { title: 'Rollback Protection', href: '/sdk/rollback-protection' },
      { title: 'Native Modules', href: '/sdk/native-modules' },
      { title: 'Expo Support', href: '/sdk/expo' },
    ],
  },
  {
    title: 'Dashboard',
    items: [
      { title: 'Apps', href: '/dashboard/apps' },
      { title: 'Releases', href: '/dashboard/releases' },
      { title: 'Channels', href: '/dashboard/channels' },
      { title: 'Teams', href: '/dashboard/teams' },
    ],
  },
  {
    title: 'API',
    items: [
      { title: 'Authentication', href: '/api/authentication' },
      { title: 'Endpoints', href: '/api/endpoints' },
      { title: 'Webhooks', href: '/api/webhooks' },
    ],
  },
  {
    title: 'Self-Hosting',
    items: [
      { title: 'Overview', href: '/self-hosting/overview' },
      { title: 'Cloudflare Workers', href: '/self-hosting/cloudflare-workers' },
      { title: 'Database Setup', href: '/self-hosting/database' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:block w-64 border-r border-gray-200 p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="space-y-8">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'block py-1.5 px-3 rounded-md text-sm transition-colors',
                      pathname === item.href
                        ? 'bg-brand-50 text-brand-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <Link
            href="/skills"
            className="flex items-center gap-2 py-2 px-3 rounded-md text-sm text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            LLM Skills Folder
          </Link>
        </div>
      </nav>
    </aside>
  )
}
