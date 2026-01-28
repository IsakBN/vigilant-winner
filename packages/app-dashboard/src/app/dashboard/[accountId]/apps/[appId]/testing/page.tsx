'use client'

/**
 * Testing Tools Page
 *
 * Provides tools for testing OTA updates including:
 * - Test device registration
 * - Update check simulation
 * - Debug mode toggle
 * - Test history and results
 */

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Beaker, Target } from 'lucide-react'
import { Button } from '@bundlenudge/shared-ui'
import {
    TestDeviceForm,
    SimulateUpdateForm,
    TestResultCard,
    TestHistoryTable,
    TestingToolsSkeleton,
    DebugModeToggle,
    TestRolloutDialog,
    RegisteredDevicesCard,
} from '@/components/testing'
import type { TestResult, TestDevice } from '@/components/testing'

// =============================================================================
// Page Header
// =============================================================================

interface PageHeaderProps {
    accountId: string
    appId: string
    onTestRollout: () => void
}

function PageHeader({ accountId, appId, onTestRollout }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <Link
                    href={`/dashboard/${accountId}/apps/${appId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-neutral-700 transition-colors mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to App
                </Link>
                <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                    <Beaker className="w-5 h-5 text-neutral-500" />
                    Testing Tools
                </h1>
            </div>
            <Button onClick={onTestRollout}>
                <Target className="w-4 h-4 mr-1.5" />
                Test Rollout
            </Button>
        </div>
    )
}

// =============================================================================
// Page Component
// =============================================================================

export default function TestingToolsPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string

    // State
    const [isLoading] = useState(false)
    const [debugMode, setDebugMode] = useState(false)
    const [testDevices, setTestDevices] = useState<TestDevice[]>([])
    const [testResults, setTestResults] = useState<TestResult[]>([])
    const [latestResult, setLatestResult] = useState<TestResult | null>(null)
    const [showRolloutDialog, setShowRolloutDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handlers
    const handleDeviceRegistered = useCallback((device: TestDevice) => {
        setTestDevices((prev) => [device, ...prev])
    }, [])

    const handleSimulationComplete = useCallback(() => {
        const result: TestResult = {
            id: crypto.randomUUID(),
            testType: 'update_check',
            status: Math.random() > 0.2 ? 'success' : 'failed',
            deviceId: testDevices[0]?.deviceId || 'anonymous',
            deviceName: testDevices[0]?.name,
            version: '1.0.0',
            channel: 'production',
            timestamp: Date.now(),
            duration: Math.floor(Math.random() * 500) + 100,
        }
        setLatestResult(result)
        setTestResults((prev) => [result, ...prev])
    }, [testDevices])

    const handleTestRollout = useCallback(
        async (deviceId: string, releaseVersion: string) => {
            setIsSubmitting(true)

            try {
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 1000))

                const device = testDevices.find((d) => d.deviceId === deviceId)
                const result: TestResult = {
                    id: crypto.randomUUID(),
                    testType: 'rollout',
                    status: Math.random() > 0.1 ? 'success' : 'failed',
                    deviceId,
                    deviceName: device?.name,
                    version: releaseVersion,
                    channel: 'test',
                    timestamp: Date.now(),
                    duration: Math.floor(Math.random() * 2000) + 500,
                }

                setLatestResult(result)
                setTestResults((prev) => [result, ...prev])
                setShowRolloutDialog(false)
            } finally {
                setIsSubmitting(false)
            }
        },
        [testDevices]
    )

    const handleDebugToggle = useCallback((enabled: boolean) => {
        setDebugMode(enabled)
    }, [])

    // Loading state
    if (isLoading) {
        return <TestingToolsSkeleton />
    }

    return (
        <>
            <div className="space-y-6">
                <PageHeader
                    accountId={accountId}
                    appId={appId}
                    onTestRollout={() => setShowRolloutDialog(true)}
                />

                <DebugModeToggle enabled={debugMode} onToggle={handleDebugToggle} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TestDeviceForm
                        appId={appId}
                        onDeviceRegistered={handleDeviceRegistered}
                    />
                    <SimulateUpdateForm appId={appId} onSimulate={handleSimulationComplete} />
                </div>

                <RegisteredDevicesCard devices={testDevices} />

                {latestResult && (
                    <div>
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                            Latest Result
                        </h2>
                        <TestResultCard result={latestResult} />
                    </div>
                )}

                <TestHistoryTable tests={testResults} />
            </div>

            <TestRolloutDialog
                open={showRolloutDialog}
                onOpenChange={setShowRolloutDialog}
                devices={testDevices}
                onSubmit={(deviceId, version) => void handleTestRollout(deviceId, version)}
                isSubmitting={isSubmitting}
            />
        </>
    )
}
