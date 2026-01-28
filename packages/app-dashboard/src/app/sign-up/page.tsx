'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signUp, signIn, emailOtp } from '@/lib/auth-client'

type Step = 'form' | 'verify'

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error: signUpError } = await signUp.email({ email, password, name })

    if (signUpError) {
      setError(signUpError.message ?? 'Failed to create account. Please try again.')
      setLoading(false)
      return
    }

    // Send verification OTP
    const { error: otpError } = await emailOtp.sendVerificationOtp({ email, type: 'email-verification' })

    if (otpError) {
      setError(otpError.message ?? 'Failed to send verification code.')
      setLoading(false)
      return
    }

    setStep('verify')
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: verifyError } = await emailOtp.verifyEmail({ email, otp })

    if (verifyError) {
      setError(verifyError.message ?? 'Invalid or expired verification code')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleResendOtp() {
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const { error: resendError } = await emailOtp.sendVerificationOtp({ email, type: 'email-verification' })

    if (resendError) {
      setError(resendError.message ?? 'Failed to resend code')
    } else {
      setSuccessMessage('Code sent! Check your email.')
      setTimeout(() => setSuccessMessage(''), 5000)
    }

    setLoading(false)
  }

  async function handleGitHubSignUp() {
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    })

    if (signInError) {
      setError(signInError.message ?? 'GitHub sign up failed. Please try again.')
      setLoading(false)
    }
  }

  // OTP Verification Step
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="https://bundlenudge.com" className="flex items-center justify-center gap-3 mb-8">
            <Image src="/logo-icon.svg" alt="BundleNudge" width={48} height={48} />
            <span className="text-2xl font-heading font-bold text-text-dark">BundleNudge</span>
          </Link>

          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-bright-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-bright-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-gray-600 mt-2">
                We sent a 6-digit code to<br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-bright-accent focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-bright-accent text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-bright-accent font-medium hover:underline disabled:opacity-50"
                >
                  Resend
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setStep('form')
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
          </div>
        </div>
      </div>
    )
  }

  // Sign Up Form
  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="https://bundlenudge.com" className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo-icon.svg" alt="BundleNudge" width={48} height={48} />
          <span className="text-2xl font-heading font-bold text-text-dark">BundleNudge</span>
        </Link>

        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-600 mt-2">Start shipping OTA updates in minutes</p>
          </div>

          {/* GitHub Sign Up */}
          <button
            onClick={handleGitHubSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" clipRule="evenodd" />
            </svg>
            {loading ? 'Redirecting...' : 'Continue with GitHub'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-bright-accent focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-bright-accent focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-bright-accent focus:border-transparent"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-bright-accent focus:border-transparent"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bright-accent text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-bright-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-8">
          <Link href="https://bundlenudge.com" className="text-text-light hover:text-bright-accent transition-colors">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
