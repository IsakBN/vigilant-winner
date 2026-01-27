'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface CodeBlockProps {
  code: string
  title?: string
  language: string
  onCopy?: () => void
}

function CopyButton({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy?.()
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard',
        variant: 'success',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'error',
      })
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'p-2 rounded-md transition-colors',
        'bg-neutral-200 hover:bg-neutral-300',
        'text-neutral-600 hover:text-neutral-800',
        'focus:outline-none focus:ring-2 focus:ring-neutral-400'
      )}
      aria-label={copied ? 'Copied' : 'Copy code'}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  )
}

export function CodeBlock({ code, title, language, onCopy }: CodeBlockProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-neutral-200">
      {title && (
        <div className="bg-neutral-100 px-4 py-2 text-sm text-neutral-600 border-b border-neutral-200 font-medium">
          {title}
        </div>
      )}
      <div className="relative">
        <pre
          className={cn(
            'bg-neutral-50 p-4 overflow-x-auto',
            'text-sm text-neutral-800 font-mono',
            'leading-relaxed'
          )}
        >
          <code data-language={language}>{code}</code>
        </pre>
        <div className="absolute top-2 right-2">
          <CopyButton text={code} onCopy={onCopy} />
        </div>
      </div>
    </div>
  )
}

export { CopyButton }
