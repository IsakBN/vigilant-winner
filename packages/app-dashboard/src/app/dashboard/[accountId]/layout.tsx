import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

interface AccountLayoutProps {
  children: React.ReactNode
  params: Promise<{ accountId: string }>
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { accountId } = await params
  return <DashboardLayout accountId={accountId}>{children}</DashboardLayout>
}
