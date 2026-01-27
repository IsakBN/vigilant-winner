'use client'

import { CopyButtons } from './CopyButtons'

interface DocPageProps {
  title: string
  description?: string
  slug: string
  children: React.ReactNode
  rawContent?: string
}

export function DocPage({ title, description, slug, children, rawContent = '' }: DocPageProps) {
  return (
    <article>
      <CopyButtons content={rawContent} title={title} slug={slug} />

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-lg text-gray-600 mt-2">{description}</p>
        )}
      </header>

      <div className="prose">
        {children}
      </div>
    </article>
  )
}
