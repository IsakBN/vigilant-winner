import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Create your free BundleNudge account. Push JavaScript updates to React Native apps without app store delays.',
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
