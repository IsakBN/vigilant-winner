import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,
  // Set output file tracing root to monorepo root for proper dependency resolution
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Redirects for old URLs
  // Using temporary redirects (307) to allow changing destinations later if needed
  async redirects() {
    return [
      // Setup page -> Overview (setup is now inline on Overview for new apps)
      {
        source: '/dashboard/:teamId/apps/:id/setup',
        destination: '/dashboard/:teamId/apps/:id',
        permanent: false,
      },
      // Testers page -> Audience with testers tab
      {
        source: '/dashboard/:teamId/apps/:id/testers',
        destination: '/dashboard/:teamId/apps/:id/audience?tab=testers',
        permanent: false,
      },
      // SDK Devices page -> Audience with devices tab
      {
        source: '/dashboard/:teamId/apps/:id/registered-devices',
        destination: '/dashboard/:teamId/apps/:id/audience?tab=devices',
        permanent: false,
      },
      // Credentials page -> Settings with integrations section
      {
        source: '/dashboard/:teamId/apps/:id/credentials',
        destination: '/dashboard/:teamId/apps/:id/settings#integrations',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
