import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'

export default function SkillsPage() {
  return (
    <div className="prose">
      <h1>LLM Skills Folder</h1>

      <p className="text-xl text-gray-600">
        Drop this folder into your repo and your AI assistant will understand BundleNudge instantly.
      </p>

      <h2>What is this?</h2>

      <p>
        The skills folder contains structured documentation designed specifically for LLMs like
        Claude, GPT-4, and Cursor. Instead of asking your AI to read our entire docs site, you
        give it a focused knowledge pack.
      </p>

      <h2>How to Use</h2>

      <ol>
        <li>
          <strong>Download the folder</strong> — Click the button below to get a zip file
        </li>
        <li>
          <strong>Add to your repo</strong> — Unzip into your project root as{' '}
          <code>.bundlenudge/</code> or <code>docs/bundlenudge/</code>
        </li>
        <li>
          <strong>Tell your AI</strong> — Say "Read the BundleNudge docs in .bundlenudge/ and
          help me integrate the SDK"
        </li>
      </ol>

      <div className="not-prose my-8">
        <a
          href="/api/skills/download"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <DownloadIcon />
          Download Skills Folder
        </a>
      </div>

      <h2>What's Inside</h2>

      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>README.md</code></td>
            <td>Start here — tells the LLM what BundleNudge is and how to help</td>
          </tr>
          <tr>
            <td><code>sdk-integration.md</code></td>
            <td>Complete SDK guide with code examples</td>
          </tr>
          <tr>
            <td><code>api-reference.md</code></td>
            <td>All API endpoints with request/response examples</td>
          </tr>
          <tr>
            <td><code>troubleshooting.md</code></td>
            <td>Common issues and how to fix them</td>
          </tr>
          <tr>
            <td><code>context.json</code></td>
            <td>Structured metadata for programmatic access</td>
          </tr>
        </tbody>
      </table>

      <h2>Example Prompts</h2>

      <p>Once your AI has read the skills folder, try these:</p>

      <CodeBlock
        code={`# Installation
"I have a React Native 0.74 app. Help me add BundleNudge."

# Debugging
"My updates aren't being applied. Help me debug using the BundleNudge docs."

# API Integration
"I want to trigger deployments from my CI. Show me the API calls."

# Rollback
"How do I set up automatic rollback if my update crashes?"

# Advanced
"Help me implement staged rollouts using channels."`}
        language="text"
      />

      <h2>Keep it Updated</h2>

      <p>
        The skills folder is versioned. We recommend re-downloading when you update your SDK to
        ensure your AI has the latest information. The <code>context.json</code> file includes a
        version number you can check programmatically.
      </p>

      <h2>Coming Soon: MCP Server</h2>

      <p>
        We're building a <Link href="https://modelcontextprotocol.io">Model Context Protocol</Link>{' '}
        server that will let Claude access BundleNudge docs directly as a tool. Stay tuned.
      </p>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
