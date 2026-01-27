/**
 * Shared formatting utilities for the dashboard.
 * Consolidates duplicated date formatting functions.
 */

type DateInput = string | number | Date | null | undefined

/**
 * Parse various date inputs into a Date object
 */
function parseDate(date: DateInput): Date | null {
  if (date === null || date === undefined) {
    return null
  }

  const parsed = date instanceof Date ? date : new Date(date)

  if (isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

/**
 * Format date for display in tables/lists
 * Example: "Jan 15, 2024"
 */
export function formatDate(date: DateInput): string {
  const parsed = parseDate(date)

  if (!parsed) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

/**
 * Format date with time
 * Example: "Jan 15, 2024, 2:30 PM"
 */
export function formatDateTime(date: DateInput): string {
  const parsed = parseDate(date)

  if (!parsed) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

/**
 * Format relative time
 * Example: "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(date: DateInput): string {
  const parsed = parseDate(date)

  if (!parsed) {
    return '-'
  }

  const now = Date.now()
  const diffMs = now - parsed.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) {
    return 'just now'
  }
  if (diffMinutes < 60) {
    return `${String(diffMinutes)} minute${diffMinutes === 1 ? '' : 's'} ago`
  }
  if (diffHours < 24) {
    return `${String(diffHours)} hour${diffHours === 1 ? '' : 's'} ago`
  }
  if (diffDays < 7) {
    return `${String(diffDays)} day${diffDays === 1 ? '' : 's'} ago`
  }
  if (diffWeeks < 4) {
    return `${String(diffWeeks)} week${diffWeeks === 1 ? '' : 's'} ago`
  }
  if (diffMonths < 12) {
    return `${String(diffMonths)} month${diffMonths === 1 ? '' : 's'} ago`
  }
  return `${String(diffYears)} year${diffYears === 1 ? '' : 's'} ago`
}

/**
 * Format duration in human-readable form
 * Example: "2d 5h", "45m", "< 1m"
 */
export function formatDuration(
  startDate: DateInput,
  endDate?: DateInput
): string {
  const start = parseDate(startDate)
  const end = endDate ? parseDate(endDate) : new Date()

  if (!start || !end) {
    return '-'
  }

  const diffMs = Math.abs(end.getTime() - start.getTime())
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return '< 1m'
  }
  if (diffHours < 1) {
    return `${String(diffMinutes)}m`
  }
  if (diffDays < 1) {
    const remainingMinutes = diffMinutes % 60
    return remainingMinutes > 0
      ? `${String(diffHours)}h ${String(remainingMinutes)}m`
      : `${String(diffHours)}h`
  }

  const remainingHours = diffHours % 24
  return remainingHours > 0
    ? `${String(diffDays)}d ${String(remainingHours)}h`
    : `${String(diffDays)}d`
}
