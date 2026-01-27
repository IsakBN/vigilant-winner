'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface CodeSnippetProps {
  code: string
  language: string
  title?: string
  onCopy?: () => void
}

export function CodeSnippet({ code, language, title, onCopy }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
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
        description: 'Could not copy to clipboard. Please try again.',
        variant: 'error',
      })
    }
  }

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
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'absolute top-2 right-2 md:top-3 md:right-3',
            'p-2.5 md:p-2 rounded-md',
            'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0',
            'flex items-center justify-center',
            'bg-neutral-200 hover:bg-neutral-300',
            'text-neutral-600 hover:text-neutral-800',
            'transition-colors duration-150',
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
      </div>
    </div>
  )
}
