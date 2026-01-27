import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your BundleNudge account email address.',
}

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
