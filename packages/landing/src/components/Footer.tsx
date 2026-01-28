import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-soft-yellow/50 py-16 bg-cream-bg shadow-inner">
      <div className="container-fluid flex flex-col md:flex-row justify-between items-center gap-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-icon.svg" alt="BundleNudge" width={36} height={36} />
          <span className="text-lg font-bold text-text-dark">BundleNudge</span>
          <span className="text-text-light text-sm hidden sm:inline">- OTA for React Native</span>
        </Link>
        <div className="flex flex-wrap gap-x-10 gap-y-4 text-base text-text-light">
          <Link className="hover:text-bright-accent transition-colors" href="/privacy">Privacy</Link>
          <Link className="hover:text-bright-accent transition-colors" href="/terms">Terms</Link>
          <Link className="hover:text-bright-accent transition-colors" href="/security">Security</Link>
          <a className="hover:text-bright-accent transition-colors" href="mailto:support@bundlenudge.com">
            Contact
          </a>
        </div>
        <p className="text-sm text-text-light opacity-80">&copy; {new Date().getFullYear()} BundleNudge</p>
      </div>
    </footer>
  )
}
