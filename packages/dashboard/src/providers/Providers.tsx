'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from './AuthProvider'
import { ToastProvider, AlertDialogProvider } from '@/components/ui'

interface ProvidersProps {
  children: ReactNode
}

// Cache time constants
const FIVE_MINUTES_MS = 1000 * 60 * 5
const THIRTY_MINUTES_MS = 1000 * 60 * 30

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes before refetching in background
        staleTime: FIVE_MINUTES_MS,
        // Data stays in cache for 30 minutes before garbage collection
        gcTime: THIRTY_MINUTES_MS,
        retry: 1,
      },
    },
  }))

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AlertDialogProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AlertDialogProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}
