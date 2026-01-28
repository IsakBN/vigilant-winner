'use client'

import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  Button,
} from '@bundlenudge/shared-ui'
import type { LogEntry as LogEntryType, LogsResponse } from '@/lib/api/types/admin'
import { LogEntry } from './LogEntry'

interface LogsTableProps {
  data: LogsResponse | undefined
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  onLogClick?: (log: LogEntryType) => void
}

const PAGE_SIZE = 20

export function LogsTable({ data, isLoading, page, onPageChange, onLogClick }: LogsTableProps) {
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0
  const showFrom = (page - 1) * PAGE_SIZE + 1
  const showTo = Math.min(page * PAGE_SIZE, data?.total ?? 0)

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-40">Timestamp</TableHead>
              <TableHead className="w-24">Level</TableHead>
              <TableHead className="w-28">Service</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-48">Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows />
            ) : !data?.logs.length ? (
              <EmptyRow />
            ) : (
              data.logs.map((log: LogEntryType) => (
                <LogEntry key={log.id} log={log} onClick={onLogClick} />
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {String(showFrom)} to {String(showTo)} of {String(data?.total ?? 0)} logs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {String(page)} of {String(totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <td className="p-2"><Skeleton className="h-4 w-28" /></td>
          <td className="p-2"><Skeleton className="h-4 w-16" /></td>
          <td className="p-2"><Skeleton className="h-4 w-20" /></td>
          <td className="p-2"><Skeleton className="h-4 w-64" /></td>
          <td className="p-2"><Skeleton className="h-4 w-32" /></td>
        </TableRow>
      ))}
    </>
  )
}

function EmptyRow() {
  return (
    <TableRow>
      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
        No logs found matching your filters
      </td>
    </TableRow>
  )
}
