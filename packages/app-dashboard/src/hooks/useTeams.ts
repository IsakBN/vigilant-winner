'use client'

/**
 * useTeams Hook
 *
 * TanStack Query hook for fetching user teams.
 */

import { useQuery } from '@tanstack/react-query'

interface Team {
  id: string
  name: string
  slug: string
  createdAt: string
}

interface TeamsResponse {
  teams: Team[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchTeams(accountId: string): Promise<TeamsResponse> {
  const response = await fetch(`${API_URL}/api/accounts/${accountId}/teams`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch teams')
  }
  return response.json() as Promise<TeamsResponse>
}

export const teamsKeys = {
  all: ['teams'] as const,
  list: (accountId: string) => [...teamsKeys.all, 'list', accountId] as const,
}

/**
 * Hook to fetch all teams for an account
 */
export function useTeams(accountId: string) {
  const query = useQuery({
    queryKey: teamsKeys.list(accountId),
    queryFn: () => fetchTeams(accountId),
    enabled: Boolean(accountId),
  })

  return {
    teams: query.data?.teams ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
