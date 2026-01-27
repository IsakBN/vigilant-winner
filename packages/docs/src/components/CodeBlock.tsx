'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language = 'typescript', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-6">
      {filename && (
        <div className="bg-gray-800 text-gray-400 text-xs px-4 py-2 rounded-t-lg border-b border-gray-700">
          {filename}
        </div>
      )}
      <pre className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto ${filename ? 'rounded-b-lg' : 'rounded-lg'}`}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
