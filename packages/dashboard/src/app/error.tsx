'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <span className="text-3xl font-heading font-bold text-bright-accent">
            BundleNudge
          </span>
        </div>

        <h1 className="font-heading text-3xl font-bold text-text-dark mb-4">
          Something went wrong
        </h1>

        <p className="font-body text-text-light mb-8">
          We encountered an unexpected error. Please try again, or return to the
          home page if the problem persists.
        </p>

        {error.digest && (
          <p className="font-body text-sm text-text-light/60 mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-bright-accent rounded-lg hover:bg-bright-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-bright-accent focus:ring-offset-2"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-text-dark bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-bright-accent focus:ring-offset-2"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
