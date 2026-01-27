'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { apps } from '@/lib/api'
import { StepIndicator } from './StepIndicator'
import { CodeBlock } from './CodeBlock'

// ============================================================================
// Types
// ============================================================================

export interface SetupWizardProps {
  appId: string
  accountId: string
  onComplete?: () => void
}

interface SetupStatus {
  sdkConnected: boolean
  firstPingAt: number | null
}

type StepId = 'install' | 'integrate' | 'verify' | 'complete'

export interface Step {
  id: StepId
  number: number
  title: string
  shortTitle: string
}

// ============================================================================
// Constants
// ============================================================================

export const STEPS: Step[] = [
  { id: 'install', number: 1, title: 'Install the SDK', shortTitle: 'Install' },
  { id: 'integrate', number: 2, title: 'Add to your app', shortTitle: 'Integrate' },
  { id: 'verify', number: 3, title: 'Verify connection', shortTitle: 'Verify' },
  { id: 'complete', number: 4, title: "You're ready!", shortTitle: 'Complete' },
]

const POLL_INTERVAL_MS = 3000

const NPM_INSTALL_COMMAND = 'npm install @bundlenudge/sdk react-native-get-random-values'

const INDEX_JS_CODE = `// index.js - This MUST be the first import
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);`

const INTEGRATION_CODE = `// App.tsx
import { BundleNudge } from '@bundlenudge/sdk';

// Initialize in your app entry point
await BundleNudge.initialize({
  appId: 'YOUR_APP_ID',
  // Optional: Enable auto-update on app start
  autoUpdate: true,
});`

// ============================================================================
// Helper Components
// ============================================================================

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={cn(
          'w-5 h-5 rounded border-2 transition-all duration-200',
          'flex items-center justify-center',
          checked
            ? 'bg-green-500 border-green-500'
            : 'border-neutral-300 group-hover:border-neutral-400'
        )}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  )
}

// ============================================================================
// Step Content Components
// ============================================================================

function StepInstall({
  confirmed,
  onConfirm,
}: {
  confirmed: boolean
  onConfirm: (value: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Install the BundleNudge SDK
        </h3>
        <p className="text-neutral-600">
          Add the SDK and required dependencies to your React Native project.
        </p>
      </div>

      <CodeBlock code={NPM_INSTALL_COMMAND} title="Terminal" language="bash" />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 font-medium mb-2">For iOS:</p>
        <p className="text-sm text-amber-700">
          Run{' '}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-xs">
            cd ios && pod install && cd ..
          </code>{' '}
          to install native modules.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Using Yarn?</strong> Run{' '}
          <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-mono text-xs">
            yarn add @bundlenudge/sdk react-native-get-random-values
          </code>{' '}
          instead.
        </p>
      </div>

      <div className="pt-2">
        <Checkbox
          checked={confirmed}
          onChange={onConfirm}
          label="I've installed the SDK and run pod install"
        />
      </div>
    </div>
  )
}

function StepIntegrate({
  appId,
  confirmed,
  onConfirm,
}: {
  appId: string
  confirmed: boolean
  onConfirm: (value: boolean) => void
}) {
  const codeWithAppId = INTEGRATION_CODE.replace('YOUR_APP_ID', appId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Add BundleNudge to your app
        </h3>
        <p className="text-neutral-600">
          Two quick steps: add the crypto polyfill to{' '}
          <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800 font-mono text-xs">
            index.js
          </code>
          , then initialize in{' '}
          <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800 font-mono text-xs">
            App.tsx
          </code>
          .
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">
            1. Add the crypto polyfill as the <strong>first import</strong>:
          </p>
          <CodeBlock code={INDEX_JS_CODE} title="index.js" language="javascript" />
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">
            2. Initialize BundleNudge in your App:
          </p>
          <CodeBlock code={codeWithAppId} title="App.tsx" language="typescript" />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> The crypto polyfill must be imported <em>before</em> any
          other code that uses the SDK. This ensures secure device ID generation.
        </p>
      </div>

      <div className="pt-2">
        <Checkbox
          checked={confirmed}
          onChange={onConfirm}
          label="I've added the polyfill and initialization code"
        />
      </div>
    </div>
  )
}

export { StepInstall, StepIntegrate, Checkbox }
export type { SetupStatus }
