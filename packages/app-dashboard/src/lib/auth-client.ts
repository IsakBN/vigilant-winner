import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'

// Auth is centralized in the Cloudflare Workers API
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [emailOTPClient()],
  fetchOptions: {
    credentials: 'include',
  },
})

export const { signIn, signUp, signOut, useSession, emailOtp, resetPassword, changePassword } = authClient

// Password reset via OTP (when emailOTP plugin is active)
export const forgetPasswordOtp = authClient.forgetPassword.emailOtp
