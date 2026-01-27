'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Beaker, TrendingUp, Users } from 'lucide-react'
import { mockABTests, mockABTestStats, type MockVariant } from '../mockData'

/**
 * ABTestingPreview
 *
 * Mock A/B testing tab shown in the onboarding preview modal.
 * Demonstrates what the A/B testing tab looks like with active experiments.
 */
export function ABTestingPreview() {
  const activeTest = mockABTests.find((t) => t.status === 'rolling')

  return (
    <div className="space-y-4">
      {/* Active Experiment Card */}
      {activeTest && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Beaker className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    v{activeTest.version} Experiment
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {activeTest.channel} - Running for 3 days
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                Active
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Variants */}
            <div className="space-y-3">
              {activeTest.variants.map((variant) => {
                const controlVariant = activeTest.variants.find(
                  (v) => v.isControl
                )
                const isWinning =
                  variant.conversionRate >
                  (controlVariant?.conversionRate ?? 0)
                return (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    isWinning={isWinning}
                  />
                )
              })}
            </div>

            {/* Results Summary */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">+38% conversion lift</span>
              </div>
              <span className="text-muted-foreground">
                95% statistical significance
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Active Tests"
          value={mockABTestStats.activeTests}
          icon={<Beaker className="w-4 h-4 text-green-500" />}
        />
        <StatCard
          label="Completed"
          value={mockABTestStats.completedTests}
          icon={<Beaker className="w-4 h-4 text-muted-foreground" />}
        />
        <StatCard
          label="Total Variants"
          value={mockABTestStats.totalVariants}
          icon={<Users className="w-4 h-4 text-blue-500" />}
        />
        <StatCard
          label="Avg Lift"
          value={mockABTestStats.avgLift}
          icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          isText
        />
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">A/B Testing</span>{' '}
            lets you compare different versions of your app to find what works
            best. Create experiments, track metrics, and make data-driven
            decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function VariantRow({
  variant,
  isWinning,
}: {
  variant: MockVariant
  isWinning: boolean
}) {
  const formattedDevices =
    variant.deviceCount >= 1000
      ? `${(variant.deviceCount / 1000).toFixed(1)}k`
      : String(variant.deviceCount)

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${
            variant.isControl ? 'bg-muted-foreground' : 'bg-blue-500'
          }`}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{variant.name}</span>
            {variant.isControl && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Control
              </span>
            )}
            {isWinning && !variant.isControl && (
              <span className="text-[10px] uppercase tracking-wide text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                Leading
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {variant.percentage}% traffic - {formattedDevices} devices
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">{variant.conversionRate}%</div>
        <div className="text-xs text-muted-foreground">conversion</div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  isText = false,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  isText?: boolean
}) {
  return (
    <div className="bg-background rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`${isText ? 'text-lg' : 'text-xl'} font-semibold`}>
        {value}
      </div>
    </div>
  )
}
