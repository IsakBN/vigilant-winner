'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BN</span>
          </div>
          <span className="font-semibold text-gray-900">BundleNudge</span>
          <span className="text-gray-400 text-sm hidden sm:inline">Docs</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/getting-started/quickstart" className="text-gray-600 hover:text-gray-900">
            Quickstart
          </Link>
          <Link href="/sdk/installation" className="text-gray-600 hover:text-gray-900">
            SDK
          </Link>
          <Link href="/api/authentication" className="text-gray-600 hover:text-gray-900">
            API
          </Link>
          <Link href="/skills" className="text-gray-600 hover:text-gray-900">
            Skills
          </Link>
          <a
            href="https://app.bundlenudge.com"
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Dashboard
          </a>
        </nav>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 py-4 px-4">
          <div className="flex flex-col gap-2">
            <Link href="/getting-started/quickstart" className="py-2 text-gray-600">
              Quickstart
            </Link>
            <Link href="/sdk/installation" className="py-2 text-gray-600">
              SDK
            </Link>
            <Link href="/api/authentication" className="py-2 text-gray-600">
              API
            </Link>
            <Link href="/skills" className="py-2 text-gray-600">
              Skills
            </Link>
            <a
              href="https://app.bundlenudge.com"
              className="py-2 text-brand-500 font-medium"
            >
              Dashboard
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
