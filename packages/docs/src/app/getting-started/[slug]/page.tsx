import { notFound } from 'next/navigation'
import { getDocBySlug, getDocsForSection } from '@/lib/docs'
import { DocPage } from '@/components/DocPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const docs = getDocsForSection('getting-started')
  return docs.map((doc) => ({
    slug: doc.meta.slug.split('/')[1],
  }))
}

export default async function GettingStartedDocPage({ params }: PageProps) {
  const { slug } = await params
  const doc = getDocBySlug('getting-started', slug)

  if (!doc) {
    notFound()
  }

  // Dynamic import of MDX content
  const Content = (await import(`@/content/getting-started/${slug}.mdx`)).default

  return (
    <DocPage
      title={doc.meta.title}
      description={doc.meta.description}
      slug={doc.meta.slug}
      rawContent={doc.content}
    >
      <Content />
    </DocPage>
  )
}
