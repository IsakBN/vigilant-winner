'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth/client'

type Step = 'email' | 'otp'

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
      setStep('otp')
    } catch {
      setError('Email not authorized or failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use signIn.emailOtp for authentication (not verifyEmail which only verifies email)
      const { error } = await authClient.signIn.emailOtp({ email, otp })
      if (error) {
        setError(error.message ?? 'Invalid or expired OTP')
        return
      }
      router.push('/admin')
    } catch {
      setError('Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })
      setSuccessMessage('Code sent! Check your email.')
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch {
      setError('Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="https://bundlenudge.com" className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo-icon.svg" alt="BundleNudge" width={48} height={48} />
          <span className="text-2xl font-heading font-bold text-text-dark">BundleNudge</span>
        </Link>

        <div className="bg-white p-8 rounded-2xl shadow-xl">
          {step === 'email' ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-admin-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-admin-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
                <p className="text-gray-600 mt-2">Secure login for authorized admins only</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bundlenudge.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Only authorized admin emails can access this dashboard
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-admin-accent text-white py-3 px-4 rounded-xl font-medium hover:bg-admin-accent-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-admin-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-admin-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
                <p className="text-gray-600 mt-2">
                  We sent a 6-digit code to<br />
                  <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {successMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-admin-accent focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-admin-accent text-white py-3 px-4 rounded-xl font-medium hover:bg-admin-accent-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Didn&apos;t receive the code?{' '}
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-admin-accent font-medium hover:underline disabled:opacity-50"
                  >
                    Resend
                  </button>
                </p>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setError('')
                    setSuccessMessage('')
                  }}
                  disabled={loading}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  &larr; Use a different email
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center mt-8">
          <Link href="https://bundlenudge.com" className="text-text-light hover:text-admin-accent transition-colors">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
