'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { GitHubIcon } from '@/components/icons'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'
  const { isAuthenticated, isLoading: isSessionLoading, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      router.replace(redirectUrl)
    }
  }, [isAuthenticated, isSessionLoading, router, redirectUrl])

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // TODO: Implement email/password login when API supports it
      // For now, show a message directing to GitHub login
      setError('Email login coming soon. Please use GitHub to sign in.')
      setIsLoading(false)
    } catch {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  function handleGitHubLogin() {
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
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-600 mt-2">
                Sign in to your BundleNudge account
              </p>
            </div>

            <Button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              size="xl"
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
            >
              <GitHubIcon className="w-5 h-5" />
              {isLoading ? 'Redirecting...' : 'Continue with GitHub'}
            </Button>

            <Divider text="or continue with email" />

            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password" className="text-gray-700">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-bright-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                size="xl"
                className="w-full bg-bright-accent text-white hover:opacity-90"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                className="text-bright-accent font-medium hover:underline"
              >
                Sign up
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  )
}
