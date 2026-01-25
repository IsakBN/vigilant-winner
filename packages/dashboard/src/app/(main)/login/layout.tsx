import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your BundleNudge account to manage OTA updates for your React Native apps.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
