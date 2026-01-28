import { Users, AppWindow, CreditCard, Activity } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'

export default function AdminHomePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value="1,234" />
        <StatCard icon={AppWindow} label="Active Apps" value="567" />
        <StatCard icon={CreditCard} label="Active Subscriptions" value="234" />
        <StatCard icon={Activity} label="API Requests (24h)" value="45.2K" />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <p className="text-gray-600">
          Welcome to the BundleNudge Admin Dashboard. Use the sidebar to navigate.
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}
