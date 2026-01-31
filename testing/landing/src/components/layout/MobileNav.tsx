'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CloseIcon } from '../icons'
import { APP_URL, NAV_LINKS } from '@/lib/constants'

type MobileNavProps = {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-cream-bg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-soft-yellow/50">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <Image src="/logo-icon.svg" alt="BundleNudge" width={32} height={32} />
            <span className="text-lg font-bold text-text-dark">BundleNudge</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-text-dark hover:text-bright-accent"
            aria-label="Close menu"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-6 space-y-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="block text-lg font-medium text-text-dark hover:text-bright-accent"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-soft-yellow/30">
            <a
              href={`${APP_URL}/sign-up`}
              className="block w-full bg-bright-accent text-white text-center font-bold px-6 py-4 rounded-xl shadow-lg"
            >
              Get Started
            </a>
          </div>
        </nav>
      </div>
    </div>
  )
}
