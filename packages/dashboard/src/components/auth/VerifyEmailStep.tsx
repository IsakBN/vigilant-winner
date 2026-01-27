'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorAlert, SuccessAlert, EmailIcon } from './shared'

interface VerifyEmailStepProps {
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

export function VerifyEmailStep({
  email,
  otp,
  setOtp,
  error,
  successMessage,
  isLoading,
  onSubmit,
  onResend,
  onBack,
}: VerifyEmailStepProps) {
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
