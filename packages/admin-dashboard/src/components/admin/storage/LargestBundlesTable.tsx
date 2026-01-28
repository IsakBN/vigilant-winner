'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bundlenudge/shared-ui'
import { formatRelativeTime } from '@bundlenudge/shared-ui'
import type { StorageLargestBundle } from '@/lib/api/types/admin'

interface LargestBundlesTableProps {
  data: StorageLargestBundle[] | undefined
  isLoading: boolean
}

/**
 * Table showing the largest bundles by size
 */
export function LargestBundlesTable({ data, isLoading }: LargestBundlesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Largest Bundles</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No bundles found
                </TableCell>
              </TableRow>
            ) : (
              data.slice(0, 10).map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell className="font-medium">{bundle.appName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{bundle.version}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatBytes(bundle.bytes)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatRelativeTime(bundle.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
