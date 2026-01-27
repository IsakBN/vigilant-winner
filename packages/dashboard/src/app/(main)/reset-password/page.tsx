'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { PasswordStrength } from '@/components/password-strength'
import {
  AuthPageLayout,
  LoadingSpinner,
  ErrorAlert,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  AlertIcon,
} from '@/components/auth'

type PageState = 'loading' | 'invalid' | 'form' | 'success'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setPageState('invalid')
      return
    }
    void validateToken(token)
  }, [token])

  async function validateToken(tokenValue: string) {
    try {
      const res = await fetch(
        `/api/auth/password/reset-password/validate?token=${encodeURIComponent(tokenValue)}`
      )
      setPageState(res.ok ? 'form' : 'invalid')
    } catch {
      setPageState('invalid')
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (res.ok) {
        setPageState('success')
      } else {
        const data = (await res.json()) as { message?: string }
        setError(data.message ?? 'Failed to reset password')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (pageState === 'loading') {
    return <LoadingSpinner />
  }

  if (pageState === 'invalid') {
    return <InvalidTokenView />
  }

  if (pageState === 'success') {
    return <SuccessView onLogin={() => router.push('/login')} />
  }

  return (
    <AuthPageLayout>
      <Card className="bg-white">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create new password</h1>
            <p className="text-gray-600 mt-2">Enter a new password for your account</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            {error && <ErrorAlert message={error} />}

            <div>
              <Label htmlFor="password" className="text-gray-700 mb-1 block">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <PasswordStrength password={password} />

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 mb-1 block">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              size="xl"
              className="w-full bg-bright-accent text-white hover:opacity-90"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/login" className="text-bright-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthPageLayout>
  )
}

function InvalidTokenView() {
  return (
    <AuthPageLayout>
      <Card className="bg-white">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid or expired link</h1>
            <p className="text-gray-600 mt-2">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/forgot-password">
              <Button size="xl" className="w-full bg-bright-accent text-white hover:opacity-90">
                Request New Reset Link
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            <Link href="/login" className="text-bright-accent font-medium hover:underline">
              Back to Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthPageLayout>
  )
}

function SuccessView({ onLogin }: { onLogin: () => void }) {
  return (
    <AuthPageLayout>
      <Card className="bg-white">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Password reset successful</h1>
            <p className="text-gray-600 mt-2">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
          <div className="mt-6">
            <Button
              onClick={onLogin}
              size="xl"
              className="w-full bg-bright-accent text-white hover:opacity-90"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthPageLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
