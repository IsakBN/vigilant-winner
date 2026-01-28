'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui'
import { Award, AlertTriangle, Loader2 } from 'lucide-react'
import type { ABTestResults } from './ExperimentResultsCard'

// =============================================================================
// Types
// =============================================================================

export interface WinnerDeclarationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: ABTestResults
  onConfirm: (variantId: string) => void
}

// =============================================================================
// Component
// =============================================================================

export function WinnerDeclarationModal({
  open,
  onOpenChange,
  results,
  onConfirm,
}: WinnerDeclarationModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const { variants, confidence } = results
  const lowConfidence = confidence < 95

  const handleConfirm = async () => {
    if (!selectedVariantId) return
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)
    onConfirm(selectedVariantId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Declare Winner
          </DialogTitle>
          <DialogDescription>
            Select the winning variant to roll out to all users.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Confidence Warning */}
          {lowConfidence && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg mb-4 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Low statistical confidence</p>
                <p className="mt-1">
                  Results show {confidence}% confidence. Consider running the test longer.
                </p>
              </div>
            </div>
          )}

          {/* Variant Selection */}
          <RadioGroup value={selectedVariantId} onValueChange={setSelectedVariantId} className="space-y-3">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className={cn(
                  'flex items-start p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedVariantId === variant.id ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'
                )}
                onClick={() => setSelectedVariantId(variant.id)}
              >
                <RadioGroupItem value={variant.id} id={variant.id} className="mt-0.5" />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={variant.id} className="font-medium cursor-pointer">{variant.name}</Label>
                    {variant.isControl && <span className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">Control</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
                    <span>{variant.devices.toLocaleString()} devices</span>
                    <span>{variant.sessions.toLocaleString()} sessions</span>
                    <span>{variant.crashRate.toFixed(2)}% crash rate</span>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedVariantId || isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Declaring...</>
            ) : (
              <><Award className="w-4 h-4 mr-1.5" />Confirm Winner</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
