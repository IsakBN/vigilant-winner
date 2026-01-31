'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MobileNav } from './MobileNav'
import { MenuIcon } from '../icons'
import { APP_URL, NAV_LINKS } from '@/lib/constants'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-cream-bg/80 backdrop-blur-md border-b border-soft-yellow/50">
        <div className="container-main h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-icon.svg" alt="BundleNudge" width={40} height={40} />
            <h2 className="text-2xl font-extrabold tracking-tight text-text-dark">BundleNudge</h2>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base font-medium text-text-light hover:text-bright-accent transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`${APP_URL}/sign-up`}
              className="bg-bright-accent text-white text-base font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-bright-accent/30 transition-all"
            >
              Get Started
            </a>
          </nav>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-text-dark hover:text-bright-accent"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <MobileNav open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
