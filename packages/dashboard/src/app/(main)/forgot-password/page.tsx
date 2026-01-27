'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

type ResetStep = 'request' | 'sent'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>('request')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await fetch('/api/auth/password/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success for security (don't reveal if email exists)
      setStep('sent')
    } catch {
      // Still show success for security
      setStep('sent')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'sent') {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/logo-icon.svg"
              alt="BundleNudge"
              width={48}
              height={48}
            />
            <span className="text-2xl font-heading font-bold text-text-dark">
              BundleNudge
            </span>
          </Link>

          <Card className="bg-white">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Check your email
                </h1>
                <p className="text-gray-600 mt-2">
                  If an account exists for{' '}
                  <span className="font-medium text-gray-900">{email}</span>,
                  you&apos;ll receive a password reset link shortly.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setStep('request')}
                    className="text-bright-accent hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>

              <div className="mt-6">
                <Link href="/login">
                  <Button
                    size="xl"
                    className="w-full bg-bright-accent text-white hover:opacity-90"
                  >
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
                Reset your password
              </h1>
              <p className="text-gray-600 mt-2">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-4">
              {error && <ErrorAlert message={error} />}

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
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                size="xl"
                className="w-full bg-bright-accent text-white hover:opacity-90"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Remember your password?{' '}
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

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {message}
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
