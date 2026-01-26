/**
 * Session Tracking - Track app sessions (foreground/background).
 */
import { AppState, type AppStateStatus } from 'react-native'

export interface SessionInfo {
  sessionId: string
  startTime: number
  endTime?: number
  durationMs?: number
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older React Native environments
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${random}`
}

/**
 * Track app sessions (foreground/background).
 * @param onSessionStart - Called when a new session starts
 * @param onSessionEnd - Called when a session ends
 * @returns Cleanup function to stop tracking
 */
export function startSessionTracking(
  onSessionStart: (session: SessionInfo) => void,
  onSessionEnd: (session: SessionInfo) => void
): () => void {
  let currentSession: SessionInfo | null = null

  const startNewSession = (): void => {
    currentSession = { sessionId: generateSessionId(), startTime: Date.now() }
    onSessionStart(currentSession)
  }

  const endCurrentSession = (): void => {
    if (!currentSession) return
    const endTime = Date.now()
    const completedSession: SessionInfo = {
      ...currentSession,
      endTime,
      durationMs: endTime - currentSession.startTime,
    }
    onSessionEnd(completedSession)
    currentSession = null
  }

  const handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active') {
      if (!currentSession) startNewSession()
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      endCurrentSession()
    }
  }

  // Start initial session if app is active
  if (AppState.currentState === 'active') startNewSession()

  // Subscribe to app state changes
  const subscription = AppState.addEventListener('change', handleAppStateChange)

  return () => {
    subscription.remove()
    endCurrentSession()
  }
}
