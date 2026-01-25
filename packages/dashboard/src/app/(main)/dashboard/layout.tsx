import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your React Native apps, releases, and OTA updates.',
}

/**
 * Root dashboard layout
 *
 * This layout just passes through children. The actual auth validation
 * and DashboardLayout are in [accountId]/layout.tsx.
 *
 * The root /dashboard page redirects to /dashboard/{userId}.
 */
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
