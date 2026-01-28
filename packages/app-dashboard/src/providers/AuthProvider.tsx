'use client'

import * as React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { authClient } from '@/lib/auth-client'

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
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const result = await authClient.getSession()
      if (result.data?.user) {
        setSession({
          user: {
            id: result.data.user.id,
            email: result.data.user.email,
            name: result.data.user.name ?? null,
            image: result.data.user.image ?? null,
          },
        })
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

  const logout = useCallback(async () => {
    try {
      await authClient.signOut()
      setSession(null)
      window.location.href = '/login'
    } catch {
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
