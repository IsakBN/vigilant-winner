import { AuthProvider } from '@/providers/AuthProvider'

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
