import { redirect } from 'next/navigation'

/**
 * This dashboard package is deprecated.
 * All routes are redirected to the new subdomain-based apps:
 * - Landing page: bundlenudge.com (packages/landing)
 * - App dashboard: app.bundlenudge.com (packages/app-dashboard)
 * - Admin dashboard: admin.bundlenudge.com (packages/admin-dashboard)
 */
export default function HomePage() {
  redirect('https://bundlenudge.com')
}
