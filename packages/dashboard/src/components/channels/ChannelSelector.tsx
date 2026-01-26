'use client'

/**
 * ChannelSelector Component
 *
 * Dropdown selector for choosing a channel when creating releases.
 */

import { Radio } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Channel } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface ChannelSelectorProps {
  channels: Channel[]
  value: string | undefined
  onChange: (channelId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// =============================================================================
// Helpers
// =============================================================================

const CHANNEL_COLORS: Record<string, string> = {
  production: 'bg-green-500',
  staging: 'bg-amber-500',
  development: 'bg-blue-500',
  beta: 'bg-purple-500',
}

function getChannelDotColor(name: string): string {
  return CHANNEL_COLORS[name] ?? 'bg-neutral-400'
}

// =============================================================================
// Component
// =============================================================================

export function ChannelSelector({
  channels,
  value,
  onChange,
  placeholder = 'Select a channel',
  disabled = false,
  className,
}: ChannelSelectorProps) {
  const selectedChannel = channels.find((c) => c.id === value)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedChannel && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  getChannelDotColor(selectedChannel.name)
                )}
              />
              <span>{selectedChannel.displayName}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {channels.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-neutral-500">
            <Radio className="w-5 h-5 mx-auto mb-2 text-neutral-300" />
            <p>No channels available</p>
          </div>
        ) : (
          channels.map((channel) => (
            <SelectItem key={channel.id} value={channel.id}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    getChannelDotColor(channel.name)
                  )}
                />
                <span>{channel.displayName}</span>
                {channel.isDefault && (
                  <span className="text-xs text-neutral-400 ml-1">(Default)</span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
