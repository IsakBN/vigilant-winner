'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Beaker, Plus, History, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// Types
// =============================================================================

interface ABTest {
  id: string
  version: string
  channel: string
  status: 'rolling' | 'complete' | 'paused'
  createdAt: number
  variantCount: number
  variants: ABTestVariant[]
}

interface ABTestVariant {
  id: string
  name: string
  percentage: number
  isControl: boolean
  deviceCount: number
  successRate: number
}

interface CreateExperimentData {
  name: string
  version: string
  channel: string
  variants: Array<{
    name: string
    branch: string
    percentage: number
    isControl: boolean
  }>
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 7) return `${String(diffDays)}d ago`
  if (diffDays < 30) return `${String(Math.floor(diffDays / 7))}w ago`
  return date.toLocaleDateString()
}

// =============================================================================
// Main Component
// =============================================================================

export default function ABTestingPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string
  const accountId = params.accountId as string

  // State
  const [tests, setTests] = useState<ABTest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create form state
  const [formData, setFormData] = useState<CreateExperimentData>({
    name: '',
    version: '1.0.0',
    channel: 'production',
    variants: [
      { name: 'Control', branch: 'main', percentage: 50, isControl: true },
      { name: 'Variant A', branch: 'feature/test', percentage: 50, isControl: false },
    ],
  })

  // Handlers
  const handleCreateExperiment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)

      try {
        // Create mock test
        const newTest: ABTest = {
          id: crypto.randomUUID(),
          version: formData.version,
          channel: formData.channel,
          status: 'rolling',
          createdAt: Date.now(),
          variantCount: formData.variants.length,
          variants: formData.variants.map((v) => ({
            id: crypto.randomUUID(),
            name: v.name,
            percentage: v.percentage,
            isControl: v.isControl,
            deviceCount: 0,
            successRate: 0,
          })),
        }

        setTests([newTest, ...tests])
        setShowCreateDialog(false)
        setFormData({
          name: '',
          version: '1.0.0',
          channel: 'production',
          variants: [
            { name: 'Control', branch: 'main', percentage: 50, isControl: true },
            { name: 'Variant A', branch: 'feature/test', percentage: 50, isControl: false },
          ],
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, tests]
  )

  const handleViewDetails = useCallback(
    (releaseId: string) => {
      router.push(`/dashboard/${accountId}/apps/${appId}/releases/${releaseId}`)
    },
    [router, accountId, appId]
  )

  const handleEndTest = useCallback((test: ABTest) => {
    setSelectedTest(test)
    setShowWinnerDialog(true)
  }, [])

  const handleDeclareWinner = useCallback(
    async (variantId: string) => {
      if (!selectedTest) return

      setIsSubmitting(true)
      try {
        // Update test status
        setTests(
          tests.map((t) =>
            t.id === selectedTest.id ? { ...t, status: 'complete' as const } : t
          )
        )
        setShowWinnerDialog(false)
        setSelectedTest(null)
      } finally {
        setIsSubmitting(false)
      }
    },
    [selectedTest, tests]
  )

  const updateVariantPercentage = (index: number, percentage: number) => {
    const newVariants = [...formData.variants]
    newVariants[index] = { ...newVariants[index], percentage }

    // Auto-adjust other variant
    if (formData.variants.length === 2) {
      const otherIndex = index === 0 ? 1 : 0
      newVariants[otherIndex] = {
        ...newVariants[otherIndex],
        percentage: 100 - percentage,
      }
    }

    setFormData({ ...formData, variants: newVariants })
  }

  // Filter tests
  const activeTests = tests.filter((t) => t.status === 'rolling')
  const completedTests = tests.filter((t) => t.status !== 'rolling')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/dashboard/${accountId}/apps/${appId}`}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">A/B Testing</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Experiment
          </Button>
        </div>

        {/* Active Experiments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
              Active Experiments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <Beaker className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No Active Experiments
                </h3>
                <p className="text-neutral-500 mb-4 max-w-sm mx-auto">
                  Create an A/B test to compare different versions of your app and
                  find what works best.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Your First Test
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTests.map((test) => (
                  <ActiveTestCard
                    key={test.id}
                    test={test}
                    onViewDetails={() => handleViewDetails(test.id)}
                    onEndTest={() => handleEndTest(test)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Experiments */}
        {completedTests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-neutral-400" />
                <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                  Completed Experiments
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-neutral-100">
                {completedTests.slice(0, 5).map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Beaker className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div>
                        <span className="font-mono text-sm font-medium">
                          v{test.version}
                        </span>
                        <p className="text-xs text-neutral-500">
                          {test.variantCount} variants
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-neutral-400">
                        {formatDate(test.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(test.id)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Experiment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <form onSubmit={(e) => void handleCreateExperiment(e)}>
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new experiment to compare different versions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                    placeholder="1.0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, channel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="alpha">Alpha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Variants</Label>
                {formData.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <Input
                        value={variant.name}
                        onChange={(e) => {
                          const newVariants = [...formData.variants]
                          newVariants[index] = { ...variant, name: e.target.value }
                          setFormData({ ...formData, variants: newVariants })
                        }}
                        placeholder="Variant name"
                        className="mb-2"
                      />
                      <Input
                        value={variant.branch}
                        onChange={(e) => {
                          const newVariants = [...formData.variants]
                          newVariants[index] = { ...variant, branch: e.target.value }
                          setFormData({ ...formData, variants: newVariants })
                        }}
                        placeholder="Git branch"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={variant.percentage}
                        onChange={(e) =>
                          updateVariantPercentage(index, Number(e.target.value))
                        }
                        className="text-center"
                      />
                      <p className="text-xs text-neutral-500 text-center mt-1">
                        % traffic
                      </p>
                    </div>
                    {variant.isControl && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        Control
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Experiment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Winner Declaration Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare Winner</DialogTitle>
            <DialogDescription>
              Select the winning variant to end this experiment
            </DialogDescription>
          </DialogHeader>

          {selectedTest && (
            <div className="py-4 space-y-3">
              {selectedTest.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => void handleDeclareWinner(variant.id)}
                  disabled={isSubmitting}
                  className="w-full p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{variant.name}</span>
                    {variant.isControl && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        Control
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span>{variant.percentage}% traffic</span>
                    <span>{variant.deviceCount} devices</span>
                    <span>{variant.successRate}% success</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWinnerDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// =============================================================================
// Active Test Card
// =============================================================================

function ActiveTestCard({
  test,
  onViewDetails,
  onEndTest,
}: {
  test: ABTest
  onViewDetails: () => void
  onEndTest: () => void
}) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-lg font-semibold">v{test.version}</span>
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded">
              Running
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {test.channel} channel &bull; Started {formatDate(test.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
          <Button variant="outline" size="sm" onClick={onEndTest}>
            End Test
          </Button>
        </div>
      </div>

      {/* Variant Results */}
      <div className="space-y-3">
        {test.variants.map((variant) => (
          <div key={variant.id} className="flex items-center gap-4">
            <div className="w-24 flex-shrink-0">
              <span className="text-sm font-medium">{variant.name}</span>
              {variant.isControl && (
                <span className="block text-xs text-neutral-400">Control</span>
              )}
            </div>
            <div className="flex-1">
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    variant.isControl ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${variant.successRate}%` }}
                />
              </div>
            </div>
            <div className="w-20 text-right text-sm">
              <span className="font-medium">{variant.successRate}%</span>
              <span className="text-neutral-400 ml-1">success</span>
            </div>
            <div className="w-24 text-right text-sm text-neutral-500">
              {variant.deviceCount} devices
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
