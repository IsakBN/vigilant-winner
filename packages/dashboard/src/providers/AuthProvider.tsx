'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
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

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (provider: 'github' | 'google') => void
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

export function AuthProvider({ children }: { children: ReactNode }) {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshSession,
      }}
    >
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
