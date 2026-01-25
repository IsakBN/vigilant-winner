import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-3 mb-8"
        >
          <span className="text-2xl font-heading font-bold text-text-dark">
            BundleNudge
          </span>
        </Link>

        <h1 className="text-8xl font-heading font-bold text-bright-accent mb-4">
          404
        </h1>

        <h2 className="text-2xl font-heading font-semibold text-text-dark mb-4">
          Page Not Found
        </h2>

        <p className="font-body text-text-light mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-bright-accent text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-white text-text-dark font-medium rounded-xl border border-gray-200 hover:border-bright-accent hover:text-bright-accent transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
