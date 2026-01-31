import Link from 'next/link'
import Image from 'next/image'

const footerLinks = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/compare/codepush', label: 'CodePush Migration' },
  { href: 'mailto:support@bundlenudge.com', label: 'Contact' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-soft-yellow/50 py-16 bg-cream-bg shadow-inner">
      <div className="container-main flex flex-col md:flex-row justify-between items-center gap-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-icon.svg" alt="BundleNudge" width={36} height={36} />
          <span className="text-lg font-bold text-text-dark">BundleNudge</span>
          <span className="text-text-light text-sm hidden sm:inline">- OTA for React Native</span>
        </Link>

        <div className="flex flex-wrap gap-x-10 gap-y-4 text-base text-text-light">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-bright-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-sm text-text-light opacity-80">
          &copy; {currentYear} BundleNudge
        </p>
      </div>
    </footer>
  )
}
