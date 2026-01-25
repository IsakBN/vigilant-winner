'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface WelcomeCardProps {
  userName: string
  accountType: 'personal' | 'team'
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function WelcomeCard({ userName, accountType }: WelcomeCardProps) {
  const greeting = getGreeting()
  const firstName = userName.split(' ')[0] || userName

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-heading font-bold text-text-dark">
              {greeting}, {firstName}!
            </h1>
            <p className="text-text-light">
              Welcome to your BundleNudge dashboard
            </p>
          </div>
          <Badge
            variant={accountType === 'personal' ? 'secondary' : 'default'}
            className="capitalize"
          >
            {accountType === 'personal' ? 'Personal' : 'Team'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
