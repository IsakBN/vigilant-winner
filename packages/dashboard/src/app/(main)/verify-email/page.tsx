'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AuthPageLayout,
  LoadingSpinner,
  CheckIcon,
  AlertIcon,
  XIcon,
} from '@/components/auth'

type VerificationState = 'loading' | 'success' | 'error' | 'no-token'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerificationState>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('no-token')
      return
    }
    void verifyEmail(token)
  }, [token])

  async function verifyEmail(tokenValue: string) {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenValue }),
      })

      if (res.ok) {
        setState('success')
      } else {
        const data = (await res.json()) as { message?: string }
        setErrorMessage(data.message ?? 'Verification failed')
        setState('error')
      }
    } catch {
      setErrorMessage('An unexpected error occurred')
      setState('error')
    }
  }

  if (state === 'loading') {
    return (
      <AuthPageLayout>
        <Card className="bg-white">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Verifying your email</h1>
              <p className="text-gray-600 mt-2">
                Please wait while we verify your email address...
              </p>
            </div>
          </CardContent>
        </Card>
      </AuthPageLayout>
    )
  }

  if (state === 'success') {
    return (
      <AuthPageLayout>
        <Card className="bg-white">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
              <p className="text-gray-600 mt-2">
                Your email has been verified successfully. You can now sign in to your account.
              </p>
            </div>
            <div className="mt-6">
              <Link href="/login">
                <Button size="xl" className="w-full bg-bright-accent text-white hover:opacity-90">
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AuthPageLayout>
    )
  }

  if (state === 'no-token') {
    return (
      <AuthPageLayout>
        <Card className="bg-white">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Missing verification link</h1>
              <p className="text-gray-600 mt-2">
                No verification token was provided. Please check your email for the verification link.
              </p>
            </div>
            <div className="mt-6">
              <Link href="/login">
                <Button size="xl" className="w-full bg-bright-accent text-white hover:opacity-90">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout>
      <Card className="bg-white">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XIcon className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verification failed</h1>
            <p className="text-gray-600 mt-2">
              {errorMessage || 'The verification link is invalid or has expired.'}
            </p>
          </div>
          <div className="mt-6">
            <Link href="/login">
              <Button size="xl" className="w-full bg-bright-accent text-white hover:opacity-90">
                Go to Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            Need a new verification email?{' '}
            <Link href="/sign-up" className="text-bright-accent font-medium hover:underline">
              Sign up again
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthPageLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
