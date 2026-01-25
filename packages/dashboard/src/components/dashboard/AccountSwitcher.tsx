'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, User, Users } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AccountSwitcherProps {
  accountId: string
}

interface Account {
  id: string
  name: string
  type: 'personal' | 'team'
  image?: string | null
}

/**
 * Account switcher dropdown
 *
 * Features:
 * - Shows current account (personal or team)
 * - Lists available accounts
 * - Option to create a new team
 */
export function AccountSwitcher({ accountId }: AccountSwitcherProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  // Build accounts list - personal account + teams
  // For now, only personal account is supported
  // Teams will be fetched from API when implemented
  const accounts: Account[] = [
    {
      id: user?.id || '',
      name: user?.name || user?.email?.split('@')[0] || 'Personal',
      type: 'personal',
      image: user?.image,
    },
    // TODO: Add team accounts from API
  ]

  const currentAccount = accounts.find((acc) => acc.id === accountId) || accounts[0]

  const handleAccountChange = (account: Account) => {
    setOpen(false)
    if (account.id !== accountId) {
      router.push(`/dashboard/${account.id}`)
    }
  }

  const handleCreateTeam = () => {
    setOpen(false)
    router.push(`/dashboard/${accountId}/team/new`)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select account"
          className="w-full justify-between bg-muted/50 border-border"
        >
          <span className="flex items-center gap-2 truncate">
            <AccountIcon account={currentAccount} />
            <span className="truncate font-medium">{currentAccount?.name}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Personal Account
        </DropdownMenuLabel>
        {accounts
          .filter((acc) => acc.type === 'personal')
          .map((account) => (
            <AccountItem
              key={account.id}
              account={account}
              isSelected={account.id === accountId}
              onSelect={() => handleAccountChange(account)}
            />
          ))}

        {/* Team accounts section */}
        {accounts.some((acc) => acc.type === 'team') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {accounts
              .filter((acc) => acc.type === 'team')
              .map((account) => (
                <AccountItem
                  key={account.id}
                  account={account}
                  isSelected={account.id === accountId}
                  onSelect={() => handleAccountChange(account)}
                />
              ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateTeam}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface AccountItemProps {
  account: Account
  isSelected: boolean
  onSelect: () => void
}

function AccountItem({ account, isSelected, onSelect }: AccountItemProps) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className={cn('flex items-center gap-2', isSelected && 'bg-accent')}
    >
      <AccountIcon account={account} />
      <span className="truncate flex-1">{account.name}</span>
      {isSelected && <Check className="h-4 w-4 shrink-0" />}
    </DropdownMenuItem>
  )
}

function AccountIcon({ account }: { account: Account }) {
  if (account.type === 'team') {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-warm-green">
        <Users className="h-3 w-3 text-text-dark" />
      </div>
    )
  }

  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-pastel-blue">
      <User className="h-3 w-3 text-text-dark" />
    </div>
  )
}
