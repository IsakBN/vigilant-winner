'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Step } from './SetupWizard'

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: Set<number>
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(step.number)
        const isCurrent = currentStep === step.number
        const isPast = step.number < currentStep

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full',
                  'transition-all duration-300',
                  isCompleted || isPast
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-neutral-100 text-neutral-400 border-2 border-neutral-200'
                )}
              >
                {isCompleted || isPast ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-1.5 hidden sm:block transition-colors duration-200',
                  isCurrent ? 'text-neutral-900 font-medium' : 'text-neutral-500'
                )}
              >
                {step.shortTitle}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 transition-colors duration-300',
                  isPast || isCompleted ? 'bg-green-500' : 'bg-neutral-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
