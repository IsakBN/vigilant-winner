'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { GitHubIcon } from '@/components/icons'

type SignUpStep = 'form' | 'verify'

export default function SignUpPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isSessionLoading, login } = useAuth()

  const [step, setStep] = useState<SignUpStep>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isSessionLoading, router])

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // TODO: Implement email/password signup when API supports it
      // For now, show a message directing to GitHub signup
      setError('Email signup coming soon. Please use GitHub to create an account.')
      setIsLoading(false)
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // TODO: Implement OTP verification
      setError('Verification not yet implemented')
      setIsLoading(false)
    } catch {
      setError('Verification failed. Please try again.')
      setIsLoading(false)
    }
  }

  async function handleResendOTP() {
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // TODO: Implement resend OTP
      setSuccessMessage('Code sent! Check your email.')
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch {
      setError('Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  function handleGitHubSignUp() {
    setIsLoading(true)
    setError('')
    login('github')
  }

  if (isSessionLoading) {
    return <LoadingSpinner />
  }

  if (isAuthenticated) {
    return <LoadingSpinner />
  }

  if (step === 'verify') {
    return (
      <VerifyStep
        email={email}
        otp={otp}
        setOtp={setOtp}
        error={error}
        successMessage={successMessage}
        isLoading={isLoading}
        onSubmit={handleVerifyOTP}
        onResend={handleResendOTP}
        onBack={() => {
          setStep('form')
          setOtp('')
          setError('')
          setSuccessMessage('')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo-icon.svg" alt="BundleNudge" width={48} height={48} />
          <span className="text-2xl font-heading font-bold text-text-dark">
            BundleNudge
          </span>
        </Link>

        <Card className="bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Create your account
              </h1>
              <p className="text-gray-600 mt-2">
                Start shipping OTA updates in minutes
              </p>
            </div>

            <Button
              onClick={handleGitHubSignUp}
              disabled={isLoading}
              size="xl"
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
            >
              <GitHubIcon className="w-5 h-5" />
              {isLoading ? 'Redirecting...' : 'Continue with GitHub'}
            </Button>

            <Divider text="or continue with email" />

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {error && <ErrorAlert message={error} />}

              <div>
                <Label htmlFor="name" className="text-gray-700 mb-1 block">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700 mb-1 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 mb-1 block">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                size="xl"
                className="w-full bg-bright-accent text-white hover:opacity-90"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-bright-accent font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center mt-8">
          <Link
            href="/"
            className="text-text-light hover:text-bright-accent transition-colors"
          >
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

interface VerifyStepProps {
  email: string
  otp: string
  setOtp: (value: string) => void
  error: string
  successMessage: string
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  onResend: () => void
  onBack: () => void
}

function VerifyStep({
  email,
  otp,
  setOtp,
  error,
  successMessage,
  isLoading,
  onSubmit,
  onResend,
  onBack,
}: VerifyStepProps) {
  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <Image src="/logo-icon.svg" alt="BundleNudge" width={48} height={48} />
          <span className="text-2xl font-heading font-bold text-text-dark">
            BundleNudge
          </span>
        </Link>

        <Card className="bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-bright-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <EmailIcon className="w-8 h-8 text-bright-accent" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Check your email
              </h1>
              <p className="text-gray-600 mt-2">
                We sent a 6-digit code to
                <br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {error && <ErrorAlert message={error} />}
              {successMessage && <SuccessAlert message={successMessage} />}

              <div>
                <Label htmlFor="otp" className="text-gray-700 mb-1 block">
                  Verification code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                size="xl"
                className="w-full bg-bright-accent text-white hover:opacity-90"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={onResend}
                  disabled={isLoading}
                  className="text-bright-accent font-medium hover:underline disabled:opacity-50"
                >
                  Resend
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={onBack}
                disabled={isLoading}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                &larr; Use a different email
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-cream-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Divider({ text }: { text: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-500">{text}</span>
      </div>
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {message}
    </div>
  )
}

function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
      {message}
    </div>
  )
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}
