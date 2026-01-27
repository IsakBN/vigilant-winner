import { notFound } from 'next/navigation'
import { getDocBySlug, getDocsForSection } from '@/lib/docs'
import { DocPage } from '@/components/DocPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const docs = getDocsForSection('sdk')
  return docs.map((doc) => ({
    slug: doc.meta.slug.split('/')[1],
  }))
}

export default async function SdkDocPage({ params }: PageProps) {
  const { slug } = await params
  const doc = getDocBySlug('sdk', slug)

  if (!doc) {
    notFound()
  }

  const Content = (await import(`@/content/sdk/${slug}.mdx`)).default

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
