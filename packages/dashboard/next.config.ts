import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,
  // Set output file tracing root to monorepo root for proper dependency resolution
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Redirects for subdomain migration
  // This dashboard is deprecated - redirecting all routes to new subdomains
  async redirects() {
    return [
      // ===========================================
      // SUBDOMAIN MIGRATION REDIRECTS (PERMANENT)
      // ===========================================

      // Redirect dashboard routes to app subdomain
      {
        source: '/dashboard/:path*',
        destination: 'https://app.bundlenudge.com/dashboard/:path*',
        permanent: true,
      },
      // Redirect auth routes to app subdomain
      {
        source: '/login',
        destination: 'https://app.bundlenudge.com/login',
        permanent: true,
      },
      {
        source: '/sign-up',
        destination: 'https://app.bundlenudge.com/sign-up',
        permanent: true,
      },
      {
        source: '/signup',
        destination: 'https://app.bundlenudge.com/sign-up',
        permanent: true,
      },
      {
        source: '/forgot-password',
        destination: 'https://app.bundlenudge.com/forgot-password',
        permanent: true,
      },
      {
        source: '/reset-password',
        destination: 'https://app.bundlenudge.com/reset-password',
        permanent: true,
      },
      {
        source: '/verify-email',
        destination: 'https://app.bundlenudge.com/verify-email',
        permanent: true,
      },
      // Redirect admin routes to admin subdomain
      {
        source: '/admin/:path*',
        destination: 'https://admin.bundlenudge.com/admin/:path*',
        permanent: true,
      },
      {
        source: '/admin',
        destination: 'https://admin.bundlenudge.com/admin',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
