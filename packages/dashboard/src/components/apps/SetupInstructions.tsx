'use client'

import { useState } from 'react'
import { Copy, Check, Terminal, Code2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface SetupInstructionsProps {
  appId: string
  apiKey: string
}

interface CodeBlockProps {
  code: string
  title?: string
  language?: string
}

// ============================================================================
// Constants
// ============================================================================

const NPM_COMMAND = 'npm install @bundlenudge/sdk react-native-get-random-values'
const YARN_COMMAND = 'yarn add @bundlenudge/sdk react-native-get-random-values'

const INDEX_CODE = `// index.js - This MUST be the first import
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);`

function getAppCode(appId: string): string {
  return `// App.tsx
import { useEffect } from 'react';
import { BundleNudge } from '@bundlenudge/sdk';

export default function App() {
  useEffect(() => {
    BundleNudge.initialize({
      appId: '${appId}',
      autoUpdate: true,
    });
  }, []);

  return (
    // Your app content
  );
}`
}

function getEnvCode(apiKey: string): string {
  return `# .env
BUNDLENUDGE_API_KEY=${apiKey}`
}

// ============================================================================
// Code Block Component
// ============================================================================

function CodeBlock({ code, title, language = 'typescript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="rounded-lg overflow-hidden border border-neutral-200">
      {title && (
        <div className="bg-neutral-100 px-4 py-2 flex items-center justify-between border-b border-neutral-200">
          <span className="text-sm text-neutral-600 font-medium">{title}</span>
          <button
            onClick={handleCopy}
            className={cn(
              'p-1.5 rounded transition-colors',
              'hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400'
            )}
            aria-label={copied ? 'Copied' : 'Copy code'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-neutral-500" />
            )}
          </button>
        </div>
      )}
      <pre className="bg-neutral-50 p-4 overflow-x-auto text-sm text-neutral-800 font-mono leading-relaxed">
        <code data-language={language}>{code}</code>
      </pre>
    </div>
  )
}

// ============================================================================
// Step Component
// ============================================================================

interface StepProps {
  number: number
  title: string
  children: React.ReactNode
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {number}
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="ml-10">{children}</div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function SetupInstructions({ appId, apiKey }: SetupInstructionsProps) {
  const [packageManager, setPackageManager] = useState<'npm' | 'yarn'>('npm')

  return (
    <div className="space-y-8">
      {/* Step 1: Install */}
      <Step number={1} title="Install the SDK">
        <div className="space-y-3">
          <p className="text-neutral-600">
            Add the BundleNudge SDK and required dependencies to your React Native project.
          </p>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPackageManager('npm')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                packageManager === 'npm'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              npm
            </button>
            <button
              onClick={() => setPackageManager('yarn')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                packageManager === 'yarn'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              yarn
            </button>
          </div>

          <CodeBlock
            code={packageManager === 'npm' ? NPM_COMMAND : YARN_COMMAND}
            title="Terminal"
            language="bash"
          />

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>iOS:</strong> Run{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">
                cd ios && pod install && cd ..
              </code>{' '}
              after installation.
            </p>
          </div>
        </div>
      </Step>

      {/* Step 2: Add polyfill */}
      <Step number={2} title="Add the crypto polyfill">
        <div className="space-y-3">
          <p className="text-neutral-600">
            The polyfill must be the <strong>first import</strong> in your entry file.
          </p>
          <CodeBlock code={INDEX_CODE} title="index.js" language="javascript" />
        </div>
      </Step>

      {/* Step 3: Initialize */}
      <Step number={3} title="Initialize BundleNudge">
        <div className="space-y-3">
          <p className="text-neutral-600">
            Add the initialization code to your app entry point.
          </p>
          <CodeBlock code={getAppCode(appId)} title="App.tsx" />
        </div>
      </Step>

      {/* Step 4: Environment */}
      <Step number={4} title="Configure environment">
        <div className="space-y-3">
          <p className="text-neutral-600">
            Store your API key securely using environment variables.
          </p>
          <CodeBlock code={getEnvCode(apiKey)} title=".env" language="bash" />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Add <code className="bg-blue-100 px-1 rounded text-xs">.env</code> to
              your <code className="bg-blue-100 px-1 rounded text-xs">.gitignore</code> to keep your
              API key secure.
            </p>
          </div>
        </div>
      </Step>

      {/* Next steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ready to push updates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600 mb-4">
            Once you run your app, BundleNudge will automatically connect and
            you can start pushing OTA updates to your users.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="https://docs.bundlenudge.com/sdk/react-native"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <Code2 className="w-4 h-4" />
              SDK Documentation
            </a>
            <a
              href="https://docs.bundlenudge.com/cli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <Terminal className="w-4 h-4" />
              CLI Guide
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
