'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GitHubIcon } from '@/components/icons'
import {
  Divider,
  ErrorAlert,
  SuccessAlert,
  EyeIcon,
  EyeOffIcon,
  PasswordStrengthIndicator,
} from './shared'

interface SignUpFormProps {
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>
  onGitHubSignUp: () => void
  error: string
  successMessage: string
  isLoading: boolean
}

export function SignUpForm({
  onSubmit,
  onGitHubSignUp,
  error,
  successMessage,
  isLoading,
}: SignUpFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  function validateForm(): string | null {
    if (!email || !password) {
      return 'Please fill in all required fields'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError('')

    const validationError = validateForm()
    if (validationError) {
      setLocalError(validationError)
      return
    }

    await onSubmit({ email, password, name: name || undefined })
  }

  const displayError = localError || error

  return (
    <>
      <Button
        onClick={onGitHubSignUp}
        disabled={isLoading}
        size="xl"
        className="w-full bg-gray-900 text-white hover:bg-gray-800"
      >
        <GitHubIcon className="w-5 h-5" />
        {isLoading ? 'Redirecting...' : 'Continue with GitHub'}
      </Button>

      <Divider text="or continue with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && <ErrorAlert message={displayError} />}
        {successMessage && <SuccessAlert message={successMessage} />}

        <div>
          <Label htmlFor="name" className="text-gray-700 mb-1 block">
            Name <span className="text-gray-400">(optional)</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              minLength={8}
              disabled={isLoading}
              className="pr-10"
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
          <PasswordStrengthIndicator password={password} />
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-gray-700 mb-1 block">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            minLength={8}
            disabled={isLoading}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
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
    </>
  )
}
