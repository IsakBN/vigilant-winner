import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002',
  plugins: [emailOTPClient()],
})

export const { useSession, signOut } = authClient
export const { sendVerificationOtp, verifyEmail } = authClient.emailOtp
