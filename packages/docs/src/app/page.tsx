import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="prose">
      <h1>Welcome to BundleNudge</h1>

      <p className="text-xl text-gray-600 mt-4">
        OTA updates for React Native. Push JavaScript changes directly to your users
        without waiting for App Store review.
      </p>

      <div className="not-prose grid gap-4 mt-8">
        <QuickLink
          href="/getting-started/quickstart"
          title="Quickstart"
          description="Ship your first update in under 5 minutes"
        />
        <QuickLink
          href="/sdk/installation"
          title="SDK Installation"
          description="Add BundleNudge to your React Native app"
        />
        <QuickLink
          href="/dashboard/apps"
          title="Dashboard Guide"
          description="Manage your apps, releases, and teams"
        />
        <QuickLink
          href="/api/authentication"
          title="API Reference"
          description="Integrate with our REST API"
        />
      </div>

      <h2>Why BundleNudge?</h2>

      <p>
        Let me tell you a story. You've just shipped your React Native app. Users love it.
        Then you find a bug. A small one, but it's annoying your users. With the traditional
        app store flow, you're looking at:
      </p>

      <ul>
        <li>Build a new binary</li>
        <li>Submit for review</li>
        <li>Wait 1-3 days</li>
        <li>Hope users update</li>
      </ul>

      <p>
        With BundleNudge, you push the fix in minutes. Your users get it automatically.
        No app store. No waiting. No friction.
      </p>

      <h2>How It Works</h2>

      <p>
        React Native apps have two parts: native code (Swift, Kotlin) and JavaScript.
        The native code needs app store review. The JavaScript? That's just a bundle file.
        BundleNudge lets you update that bundle over-the-air.
      </p>

      <ol>
        <li><strong>Install our SDK</strong> — A few lines in your app</li>
        <li><strong>Deploy your bundle</strong> — Through our dashboard or CLI</li>
        <li><strong>Users get updates</strong> — Automatically, in the background</li>
        <li><strong>Roll back if needed</strong> — One click to revert</li>
      </ol>

      <h2>LLM-Friendly Docs</h2>

      <p>
        Every page on this site is available as structured JSON. Click the
        <strong> "Copy as JSON"</strong> or <strong>"Copy as Markdown"</strong> buttons
        on any page. Or grab everything at once from our{' '}
        <Link href="/api/docs">docs API</Link>.
      </p>

      <p>
        Building with Claude, Cursor, or another AI tool? Check out our{' '}
        <Link href="/skills">skills folder</Link> — drop it in your repo and your AI
        assistant will understand BundleNudge instantly.
      </p>
    </div>
  )
}

function QuickLink({
  href,
  title,
  description
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="block p-4 border border-gray-200 rounded-lg hover:border-brand-500 hover:bg-orange-50 transition-colors"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </Link>
  )
}
