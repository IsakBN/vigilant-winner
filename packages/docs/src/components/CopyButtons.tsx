'use client'

import { useState } from 'react'

interface CopyButtonsProps {
  content: string
  title: string
  slug: string
}

export function CopyButtons({ content, title, slug }: CopyButtonsProps) {
  const [copied, setCopied] = useState<'json' | 'md' | null>(null)

  const copyAsJson = async () => {
    const json = JSON.stringify({
      title,
      slug,
      content,
      format: 'markdown',
      source: 'docs.bundlenudge.com',
      exportedAt: new Date().toISOString(),
    }, null, 2)

    await navigator.clipboard.writeText(json)
    setCopied('json')
    setTimeout(() => setCopied(null), 2000)
  }

  const copyAsMarkdown = async () => {
    const md = `# ${title}\n\n${content}\n\n---\n*Source: docs.bundlenudge.com/${slug}*`
    await navigator.clipboard.writeText(md)
    setCopied('md')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex gap-2 mb-6 pb-4 border-b border-gray-200">
      <button
        onClick={copyAsJson}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        {copied === 'json' ? (
          <>
            <CheckIcon />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <CopyIcon />
            <span>Copy as JSON</span>
          </>
        )}
      </button>
      <button
        onClick={copyAsMarkdown}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        {copied === 'md' ? (
          <>
            <CheckIcon />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <CopyIcon />
            <span>Copy as Markdown</span>
          </>
        )}
      </button>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
