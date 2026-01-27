import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDir = path.join(process.cwd(), 'content')

export interface DocMeta {
  title: string
  description: string
  slug: string
  section: string
  order?: number
}

export interface Doc {
  meta: DocMeta
  content: string
}

export function getDocBySlug(section: string, slug: string): Doc | null {
  const filePath = path.join(contentDir, section, `${slug}.mdx`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)

  return {
    meta: {
      title: data.title ?? slug,
      description: data.description ?? '',
      slug: `${section}/${slug}`,
      section,
      order: data.order,
    },
    content,
  }
}

export function getAllDocs(): Doc[] {
  const sections = fs.readdirSync(contentDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const docs: Doc[] = []

  for (const section of sections) {
    const sectionDir = path.join(contentDir, section)
    const files = fs.readdirSync(sectionDir)
      .filter(f => f.endsWith('.mdx'))

    for (const file of files) {
      const slug = file.replace('.mdx', '')
      const doc = getDocBySlug(section, slug)
      if (doc) {
        docs.push(doc)
      }
    }
  }

  return docs.sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99))
}

export function getDocsForSection(section: string): Doc[] {
  const sectionDir = path.join(contentDir, section)

  if (!fs.existsSync(sectionDir)) {
    return []
  }

  const files = fs.readdirSync(sectionDir)
    .filter(f => f.endsWith('.mdx'))

  return files
    .map(file => getDocBySlug(section, file.replace('.mdx', '')))
    .filter((doc): doc is Doc => doc !== null)
    .sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99))
}

export function getAllDocsAsJson() {
  const docs = getAllDocs()
  return docs.map(doc => ({
    title: doc.meta.title,
    description: doc.meta.description,
    slug: doc.meta.slug,
    section: doc.meta.section,
    content: doc.content,
  }))
}
