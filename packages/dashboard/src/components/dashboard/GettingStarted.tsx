'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface GettingStartedProps {
  accountId: string
  hasApp: boolean
  hasInstalledSdk: boolean
  hasDeployedRelease: boolean
}

interface StepItem {
  id: string
  title: string
  description: string
  completed: boolean
  actionLabel: string
  actionHref: string
  external?: boolean
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
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

function ArrowIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )
}

function StepIndicator({
  completed,
  stepNumber,
}: {
  completed: boolean
  stepNumber: number
}) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
        completed
          ? 'bg-success text-white'
          : 'bg-muted border-2 border-border text-text-light'
      )}
    >
      {completed ? <CheckIcon /> : <span className="text-sm">{stepNumber}</span>}
    </div>
  )
}

function Step({
  step,
  stepNumber,
  isLast,
}: {
  step: StepItem
  stepNumber: number
  isLast: boolean
}) {
  return (
    <div className="relative">
      {!isLast && (
        <div
          className={cn(
            'absolute left-4 top-8 w-0.5 h-[calc(100%-8px)]',
            step.completed ? 'bg-success' : 'bg-border'
          )}
        />
      )}
      <div className="flex gap-4">
        <StepIndicator completed={step.completed} stepNumber={stepNumber} />
        <div className="flex-1 pb-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4
                className={cn(
                  'font-medium',
                  step.completed ? 'text-text-light' : 'text-text-dark'
                )}
              >
                {step.title}
              </h4>
              <p className="text-sm text-text-light mt-0.5">
                {step.description}
              </p>
            </div>
            {!step.completed && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="shrink-0 gap-1"
              >
                {step.external ? (
                  <a
                    href={step.actionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {step.actionLabel}
                    <ArrowIcon />
                  </a>
                ) : (
                  <Link href={step.actionHref}>
                    {step.actionLabel}
                    <ArrowIcon />
                  </Link>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function GettingStarted({
  accountId,
  hasApp,
  hasInstalledSdk,
  hasDeployedRelease,
}: GettingStartedProps) {
  const steps: StepItem[] = [
    {
      id: 'create-app',
      title: 'Create your first app',
      description: 'Connect a GitHub repository to get started.',
      completed: hasApp,
      actionLabel: 'Create',
      actionHref: `/dashboard/${accountId}/apps/new`,
    },
    {
      id: 'install-sdk',
      title: 'Install the SDK',
      description: 'Add BundleNudge to your React Native app.',
      completed: hasInstalledSdk,
      actionLabel: 'Docs',
      actionHref: 'https://docs.bundlenudge.com/quickstart',
      external: true,
    },
    {
      id: 'deploy-release',
      title: 'Deploy your first release',
      description: 'Push an OTA update to your users.',
      completed: hasDeployedRelease,
      actionLabel: 'Deploy',
      actionHref: `/dashboard/${accountId}/apps`,
    },
  ]

  const completedCount = steps.filter((s) => s.completed).length
  const allComplete = completedCount === steps.length

  if (allComplete) {
    return null
  }

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading font-semibold">
            Getting Started
          </CardTitle>
          <span className="text-sm text-text-light">
            {completedCount}/{steps.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {steps.map((step, index) => (
            <Step
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
