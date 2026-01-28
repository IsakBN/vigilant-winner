import { Card } from '@bundlenudge/shared-ui'

interface AccountDashboardPageProps {
  params: Promise<{ accountId: string }>
}

/**
 * Account dashboard home page
 *
 * Shows an overview of the account including:
 * - Quick stats (apps, releases, devices)
 * - Recent activity
 * - Getting started guide (if new)
 */
export default async function AccountDashboardPage({ params }: AccountDashboardPageProps) {
  const { accountId } = await params

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-dark">Dashboard</h1>
        <p className="text-text-light mt-1">
          Welcome to your BundleNudge dashboard
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm font-medium text-text-light">Apps</div>
          <div className="text-3xl font-semibold text-text-dark mt-1">0</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-text-light">Releases</div>
          <div className="text-3xl font-semibold text-text-dark mt-1">0</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-text-light">Active Devices</div>
          <div className="text-3xl font-semibold text-text-dark mt-1">0</div>
        </Card>
      </div>

      {/* Getting started */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-dark">Getting Started</h2>
        <p className="text-text-light mt-2">
          Create your first app to start pushing OTA updates to your React Native application.
        </p>
        <div className="mt-4">
          <a
            href={`/dashboard/${accountId}/apps/new`}
            className="inline-flex items-center px-4 py-2 bg-bright-accent text-white rounded-md hover:bg-bright-accent/90 transition-colors"
          >
            Create App
          </a>
        </div>
      </Card>
    </div>
  )
}
