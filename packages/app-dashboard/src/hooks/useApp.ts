'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apps } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

export interface App {
  id: string
  name: string
  platform: 'ios' | 'android' | 'both'
  bundleId: string
  createdAt: number
  updatedAt: number
}

export interface AppStats {
  activeDevices: number
  totalReleases: number
  downloadsThisMonth: number
}

export interface AppWithStats extends App {
  stats: AppStats
  apiKey?: string | null
}

interface UpdateAppInput {
  name?: string
  bundleId?: string
}

// ============================================================================
// Hooks
// ============================================================================

export function useAppDetails(accountId: string, appId: string) {
  return useQuery({
    queryKey: ['app', accountId, appId],
    queryFn: () => apps.getWithStats(accountId, appId),
    enabled: Boolean(accountId) && Boolean(appId),
    staleTime: 30 * 1000,
  })
}

export function useUpdateApp(accountId: string, appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateAppInput) => {
      const response = await fetch(`/api/accounts/${accountId}/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to update app')
      }
      return response.json() as Promise<{ app: App }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['app', accountId, appId] })
      void queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useDeleteAppById(accountId: string, appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apps.delete(accountId, appId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useRegenerateApiKey(accountId: string, appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/accounts/${accountId}/apps/${appId}/api-key`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to regenerate API key')
      }
      return response.json() as Promise<{ apiKey: string }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['app', accountId, appId] })
    },
  })
}
