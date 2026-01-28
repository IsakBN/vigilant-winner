'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@bundlenudge/shared-ui'

// ============================================================================
// Types
// ============================================================================

interface CodeBlockProps {
  code: string
  title?: string
  language?: string
}

// ============================================================================
// Component
// ============================================================================

export function CodeBlock({ code, title, language = 'typescript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently fail if clipboard is not available
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
