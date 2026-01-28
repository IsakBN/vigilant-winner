// ============================================================================
// Types
// ============================================================================

interface SetupStepProps {
  number: number
  title: string
  children: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

export function SetupStep({ number, title, children }: SetupStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {number}
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="ml-10">{children}</div>
    </div>
  )
}
