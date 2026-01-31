'use client'

import { useEffect, useState } from 'react'
import { APP_URL } from '@/lib/constants'

export function StickyCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (roughly 600px)
      setVisible(window.scrollY > 600)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg p-4 safe-area-bottom">
      <a
        href={`${APP_URL}/sign-up`}
        className="block w-full bg-bright-accent text-white text-center font-bold py-4 rounded-xl shadow-lg"
      >
        Get Started Free
      </a>
    </div>
  )
}
