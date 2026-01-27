'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/providers/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { auth } from '@/lib/api/auth'
import { LoadingSpinner, VerifyEmailStep } from '@/components/auth'
import { SignUpForm } from '@/components/auth/SignUpForm'

type SignUpStep = 'form' | 'verify'

export default function SignUpPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isSessionLoading, login, refreshSession } = useAuth()

  const [step, setStep] = useState<SignUpStep>('form')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isSessionLoading, router])

  async function handleEmailSignUp(data: { email: string; password: string; name?: string }) {
    setIsLoading(true)
    setError('')
    setEmail(data.email)

    try {
      const result = await auth.signup(data.email, data.password, data.name)

      if (result.requiresVerification) {
        setStep('verify')
      } else if (result.user) {
        await refreshSession()
        router.replace('/dashboard')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await auth.verifyEmail(email, otp)
      if (result.success) {
        await refreshSession()
        router.replace('/dashboard')
      } else {
        setError('Invalid verification code')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendOTP() {
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      await auth.resendVerification(email)
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

  if (isSessionLoading || isAuthenticated) {
    return <LoadingSpinner />
  }

  if (step === 'verify') {
    return (
      <VerifyEmailStep
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

            <SignUpForm
              onSubmit={handleEmailSignUp}
              onGitHubSignUp={handleGitHubSignUp}
              error={error}
              successMessage={successMessage}
              isLoading={isLoading}
            />
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
