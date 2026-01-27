import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Simple function to create a basic zip-like response
// In production, you'd use a proper zip library
export async function GET() {
  const skillsDir = path.join(process.cwd(), 'skills')

  if (!fs.existsSync(skillsDir)) {
    return NextResponse.json({ error: 'Skills folder not found' }, { status: 404 })
  }

  const files = fs.readdirSync(skillsDir)
  const contents: Record<string, string> = {}

  for (const file of files) {
    const filePath = path.join(skillsDir, file)
    if (fs.statSync(filePath).isFile()) {
      contents[file] = fs.readFileSync(filePath, 'utf-8')
    }
  }

  // Return as JSON for now - in production, use archiver for actual zip
  // This is easier to handle and still useful for LLMs
  const bundle = {
    name: 'bundlenudge-skills',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    files: contents,
    usage: 'Extract to .bundlenudge/ in your repo root, then tell your AI to read it.',
  }

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="bundlenudge-skills.json"',
    },
  })
}
