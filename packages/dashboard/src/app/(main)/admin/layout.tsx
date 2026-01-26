'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { checkAdminAccess } from '@/lib/api'
import { AdminSidebar } from '@/components/admin'

/**
 * Admin dashboard layout
 *
 * Provides admin-only access control and the admin navigation shell.
 * Redirects non-admins to the main dashboard.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoading, isAuthenticated, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check admin access
  const isAdmin = checkAdminAccess(user?.email)

  // Redirect non-authenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/admin')
    }
  }, [isLoading, isAuthenticated, router])

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  // Show loading state while checking auth
  if (isLoading) {
    return <AdminLoadingState />
  }

  // Show loading while redirecting
  if (!isAuthenticated || !isAdmin) {
    return <AdminLoadingState />
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="lg:pl-56">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-white">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-text-light hover:text-text-dark transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title */}
            <div className="flex-1 lg:ml-0">
              <h1 className="text-lg font-semibold text-text-dark hidden lg:block">
                Admin Dashboard
              </h1>
            </div>

            {/* Admin user info */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-light">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function AdminLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <div className="w-8 h-8 border-2 border-bright-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
