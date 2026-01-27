import { NextResponse } from 'next/server'
import { getAllDocsAsJson } from '@/lib/docs'

export async function GET() {
  const docs = getAllDocsAsJson()

  return NextResponse.json({
    version: '1.0',
    generatedAt: new Date().toISOString(),
    source: 'docs.bundlenudge.com',
    totalDocs: docs.length,
    docs,
  })
}
