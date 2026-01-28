'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import {
  Beaker,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Clock,
  Award,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface ABTestResults {
  variants: Array<{
    id: string
    name: string
    isControl: boolean
    devices: number
    sessions: number
    crashRate: number
  }>
  confidence: number
  startedAt: number
  status: 'running' | 'paused' | 'completed'
}

export interface ExperimentResultsCardProps {
  results: ABTestResults
  onDeclareWinner: () => void
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

// =============================================================================
// Helpers
// =============================================================================

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 95) return 'high'
  if (confidence >= 80) return 'medium'
  return 'low'
}

function formatDuration(startTimestamp: number): string {
  const diffMs = Date.now() - startTimestamp
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days === 0) return `${String(hours)}h`
  return `${String(days)}d ${String(hours)}h`
}

// =============================================================================
// Sub-Components
// =============================================================================

function TrendIndicator({ value, lowerIsBetter = false }: { value: number; lowerIsBetter?: boolean }) {
  const isPositive = lowerIsBetter ? value < 0 : value > 0
  const isNeutral = Math.abs(value) < 1

  if (isNeutral) {
    return (
      <span className="flex items-center gap-1 text-xs text-neutral-500">
        <Minus className="w-3 h-3" />
        {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  return (
    <span className={cn('flex items-center gap-1 text-xs', isPositive ? 'text-green-600' : 'text-red-600')}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function ConfidenceBadge({ level, confidence }: { level: ConfidenceLevel; confidence: number }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        level === 'high' && 'border-green-200 bg-green-50 text-green-700',
        level === 'medium' && 'border-amber-200 bg-amber-50 text-amber-700',
        level === 'low' && 'border-neutral-200 text-neutral-500'
      )}
    >
      {confidence}% confidence
    </Badge>
  )
}

// =============================================================================
// Component
// =============================================================================

export function ExperimentResultsCard({ results, onDeclareWinner }: ExperimentResultsCardProps) {
  const { variants, confidence, startedAt, status } = results
  const confidenceLevel = getConfidenceLevel(confidence)
  const controlVariant = variants.find((v) => v.isControl)
  const totalDevices = variants.reduce((sum, v) => sum + v.devices, 0)
  const isRunning = status === 'running'

  return (
    <Card className={cn(isRunning && 'border-blue-200')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isRunning ? 'bg-blue-100' : 'bg-neutral-100')}>
              <Beaker className={cn('w-4 h-4', isRunning ? 'text-blue-600' : 'text-neutral-500')} />
            </div>
            <CardTitle className="text-base">A/B Test Results</CardTitle>
          </div>
          <Badge variant={isRunning ? 'default' : 'secondary'} className={cn(isRunning && 'bg-blue-100 text-blue-700 hover:bg-blue-100')}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Variant Comparison Table */}
        <div className="mb-4 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-neutral-600">Variant</th>
                <th className="text-right px-3 py-2 font-medium text-neutral-600">Devices</th>
                <th className="text-right px-3 py-2 font-medium text-neutral-600">Sessions</th>
                <th className="text-right px-3 py-2 font-medium text-neutral-600">Crash Rate</th>
                <th className="text-right px-3 py-2 font-medium text-neutral-600">vs Control</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => {
                const crashDiff = controlVariant && !variant.isControl
                  ? ((variant.crashRate - controlVariant.crashRate) / Math.max(controlVariant.crashRate, 0.01)) * 100
                  : 0

                return (
                  <tr key={variant.id} className="border-t border-neutral-100">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{variant.name}</span>
                        {variant.isControl && <span className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">Control</span>}
                      </div>
                    </td>
                    <td className="text-right px-3 py-2 text-neutral-600">{variant.devices.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 text-neutral-600">{variant.sessions.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 text-neutral-600">{variant.crashRate.toFixed(2)}%</td>
                    <td className="text-right px-3 py-2">
                      {variant.isControl ? <span className="text-neutral-400">-</span> : <TrendIndicator value={crashDiff} lowerIsBetter />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Confidence Section */}
        <div className={cn('flex items-center justify-between p-3 rounded-lg mb-4', confidenceLevel === 'high' ? 'bg-green-50' : confidenceLevel === 'medium' ? 'bg-amber-50' : 'bg-neutral-50')}>
          <div className="flex items-center gap-2">
            <Award className={cn('w-4 h-4', confidenceLevel === 'high' ? 'text-green-600' : confidenceLevel === 'medium' ? 'text-amber-600' : 'text-neutral-400')} />
            <span className="text-sm">{confidenceLevel === 'high' ? 'Statistical significance reached' : 'Collecting more data...'}</span>
          </div>
          <ConfidenceBadge level={confidenceLevel} confidence={confidence} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
          <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{totalDevices.toLocaleString()} devices</span></div>
          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>Running for {formatDuration(startedAt)}</span></div>
        </div>

        {/* Actions */}
        {isRunning && confidenceLevel === 'high' && (
          <Button onClick={onDeclareWinner} className="w-full"><Award className="w-4 h-4 mr-1.5" />Declare Winner</Button>
        )}
      </CardContent>
    </Card>
  )
}
