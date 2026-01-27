'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
  apiKey?: string | null // Only returned when app is first created or regenerated
}

interface UpdateAppInput {
  name?: string
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchApp(appId: string): Promise<AppWithStats> {
  const response = await fetch(`/api/apps/${appId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch app')
  }
  return response.json() as Promise<AppWithStats>
}

async function updateApp(appId: string, data: UpdateAppInput): Promise<App> {
  const response = await fetch(`/api/apps/${appId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update app')
  }
  return response.json() as Promise<App>
}

async function deleteApp(appId: string): Promise<void> {
  const response = await fetch(`/api/apps/${appId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete app')
  }
}

async function regenerateApiKey(appId: string): Promise<{ apiKey: string }> {
  const response = await fetch(`/api/apps/${appId}/api-key`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Failed to regenerate API key')
  }
  return response.json() as Promise<{ apiKey: string }>
}

// ============================================================================
// Hooks
// ============================================================================

export function useApp(appId: string) {
  return useQuery({
    queryKey: ['app', appId],
    queryFn: () => fetchApp(appId),
    enabled: Boolean(appId),
    staleTime: 30 * 1000,
  })
}

export function useUpdateApp(appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAppInput) => updateApp(appId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['app', appId] })
      void queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useDeleteApp(appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteApp(appId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useRegenerateApiKey(appId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => regenerateApiKey(appId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['app', appId] })
    },
  })
}
