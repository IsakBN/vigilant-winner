'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apps } from '@/lib/api'
import { StepIndicator } from './StepIndicator'
import { StepInstall, StepIntegrate, STEPS, type SetupStatus } from './SetupWizard'
import { StepVerify } from './StepVerify'
import { StepComplete } from './StepComplete'

// ============================================================================
// Types
// ============================================================================

export interface SetupWizardContainerProps {
  appId: string
  accountId: string
  onComplete?: () => void
}

const POLL_INTERVAL_MS = 3000

// ============================================================================
// Main SetupWizardContainer Component
// ============================================================================

export function SetupWizardContainer({
  appId,
  accountId,
  onComplete,
}: SetupWizardContainerProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Step-specific state
  const [installConfirmed, setInstallConfirmed] = useState(false)
  const [integrateConfirmed, setIntegrateConfirmed] = useState(false)

  // Verification state
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState(false)

  const isMountedRef = useRef(true)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch setup status
  const fetchStatus = useCallback(async (): Promise<boolean> => {
    try {
      const result = await apps.getSetupStatus(accountId, appId)
      if (isMountedRef.current) {
        setSetupStatus(result)
        setVerifyError(false)
      }
      return result.sdkConnected
    } catch {
      if (isMountedRef.current) {
        setVerifyError(true)
      }
      return false
    } finally {
      if (isMountedRef.current) {
        setIsVerifying(false)
      }
    }
  }, [accountId, appId])

  // Start polling when entering step 3
  useEffect(() => {
    if (currentStep !== 3) return

    isMountedRef.current = true
    setIsVerifying(true)

    const startPolling = async () => {
      const isConnected = await fetchStatus()

      if (isConnected && isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            setCompletedSteps((prev) => new Set([...prev, 3]))
            setCurrentStep(4)
          }
        }, 1500)
        return
      }

      if (!isConnected && isMountedRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          const connected = await fetchStatus()
          if (connected && isMountedRef.current) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setTimeout(() => {
              if (isMountedRef.current) {
                setCompletedSteps((prev) => new Set([...prev, 3]))
                setCurrentStep(4)
              }
            }, 1500)
          }
        }, POLL_INTERVAL_MS)
      }
    }

    startPolling()

    return () => {
      isMountedRef.current = false
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [currentStep, fetchStatus])

  // Handle step completion and navigation
  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleRetryVerification = () => {
    setIsVerifying(true)
    setVerifyError(false)
    fetchStatus()
  }

  // Determine if can proceed to next step
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return installConfirmed
      case 2:
        return integrateConfirmed
      case 3:
        return setupStatus?.sdkConnected
      default:
        return false
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-8 pb-6">
        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        <div className="min-h-[400px] flex flex-col">
          {/* Step content */}
          <div className="flex-1">
            {currentStep === 1 && (
              <StepInstall confirmed={installConfirmed} onConfirm={setInstallConfirmed} />
            )}
            {currentStep === 2 && (
              <StepIntegrate
                appId={appId}
                confirmed={integrateConfirmed}
                onConfirm={setIntegrateConfirmed}
              />
            )}
            {currentStep === 3 && (
              <StepVerify
                status={setupStatus}
                isLoading={isVerifying}
                hasError={verifyError}
                onRetry={handleRetryVerification}
              />
            )}
            {currentStep === 4 && (
              <StepComplete accountId={accountId} appId={appId} onComplete={onComplete} />
            )}
          </div>

          {/* Navigation buttons */}
          {currentStep < 4 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={currentStep === 1 ? 'invisible' : ''}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 3 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!setupStatus?.sdkConnected}
                  variant={setupStatus?.sdkConnected ? 'default' : 'outline'}
                >
                  {setupStatus?.sdkConnected ? (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Waiting for connection...'
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
