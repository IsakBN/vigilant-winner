'use client'

import * as React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
}

interface Session {
  user: User
  accessToken?: string
}

interface EmailLoginResult {
  success: boolean
  error?: string
  requiresVerification?: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (provider: 'github' | 'google') => void
  loginWithEmail: (email: string, password: string) => Promise<EmailLoginResult>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

interface SessionResponse {
  user?: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  } | null
  accessToken?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json() as SessionResponse
        if (data.user) {
          setSession({
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name ?? null,
              image: data.user.image ?? null,
            },
            accessToken: data.accessToken,
          })
        } else {
          setSession(null)
        }
      } else {
        setSession(null)
      }
    } catch {
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSession()
  }, [fetchSession])

  const login = useCallback((provider: 'github' | 'google') => {
    const redirectUrl = `${API_URL}/api/auth/${provider}`
    window.location.href = redirectUrl
  }, [])

  const loginWithEmail = useCallback(async (
    email: string,
    password: string
  ): Promise<EmailLoginResult> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json() as {
        user?: SessionResponse['user']
        error?: string
        message?: string
        requiresVerification?: boolean
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Login failed',
          requiresVerification: data.requiresVerification,
        }
      }

      // Refresh session after successful login
      await fetchSession()
      return { success: true }
    } catch {
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [fetchSession])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      setSession(null)
      window.location.href = '/'
    } catch {
      // Still clear session on error
      setSession(null)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    await fetchSession()
  }, [fetchSession])

  const user = session?.user ?? null

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithEmail,
    logout,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
