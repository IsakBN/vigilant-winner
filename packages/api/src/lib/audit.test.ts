import { describe, it, expect } from 'vitest'
import { AUDIT_EVENTS, type AuditLogEntry } from './audit'

describe('audit', () => {
  describe('AUDIT_EVENTS', () => {
    describe('team events', () => {
      it('has team.created event', () => {
        expect(AUDIT_EVENTS.TEAM_CREATED).toBe('team.created')
      })

      it('has team.updated event', () => {
        expect(AUDIT_EVENTS.TEAM_UPDATED).toBe('team.updated')
      })

      it('has team.deleted event', () => {
        expect(AUDIT_EVENTS.TEAM_DELETED).toBe('team.deleted')
      })
    })

    describe('member events', () => {
      it('has member_invited event', () => {
        expect(AUDIT_EVENTS.MEMBER_INVITED).toBe('team.member_invited')
      })

      it('has member_joined event', () => {
        expect(AUDIT_EVENTS.MEMBER_JOINED).toBe('team.member_joined')
      })

      it('has member_removed event', () => {
        expect(AUDIT_EVENTS.MEMBER_REMOVED).toBe('team.member_removed')
      })

      it('has role_changed event', () => {
        expect(AUDIT_EVENTS.ROLE_CHANGED).toBe('team.role_changed')
      })
    })

    describe('project events', () => {
      it('has project.created event', () => {
        expect(AUDIT_EVENTS.PROJECT_CREATED).toBe('project.created')
      })

      it('has project.member_added event', () => {
        expect(AUDIT_EVENTS.PROJECT_MEMBER_ADDED).toBe('project.member_added')
      })

      it('has project.member_removed event', () => {
        expect(AUDIT_EVENTS.PROJECT_MEMBER_REMOVED).toBe('project.member_removed')
      })
    })

    describe('release events', () => {
      it('has release.created event', () => {
        expect(AUDIT_EVENTS.RELEASE_CREATED).toBe('release.created')
      })

      it('has release.updated event', () => {
        expect(AUDIT_EVENTS.RELEASE_UPDATED).toBe('release.updated')
      })

      it('has release.rolled_back event', () => {
        expect(AUDIT_EVENTS.RELEASE_ROLLED_BACK).toBe('release.rolled_back')
      })
    })

    describe('billing events', () => {
      it('has subscription.created event', () => {
        expect(AUDIT_EVENTS.SUBSCRIPTION_CREATED).toBe('subscription.created')
      })

      it('has subscription.updated event', () => {
        expect(AUDIT_EVENTS.SUBSCRIPTION_UPDATED).toBe('subscription.updated')
      })

      it('has subscription.cancelled event', () => {
        expect(AUDIT_EVENTS.SUBSCRIPTION_CANCELLED).toBe('subscription.cancelled')
      })
    })
  })

  describe('AuditLogEntry interface', () => {
    it('validates required fields', () => {
      const entry: AuditLogEntry = {
        organizationId: 'org-123',
        userId: 'user-456',
        event: AUDIT_EVENTS.TEAM_CREATED,
      }

      expect(entry.organizationId).toBe('org-123')
      expect(entry.userId).toBe('user-456')
      expect(entry.event).toBe('team.created')
    })

    it('allows optional metadata', () => {
      const entry: AuditLogEntry = {
        organizationId: 'org-123',
        userId: 'user-456',
        event: AUDIT_EVENTS.MEMBER_INVITED,
        metadata: {
          email: 'invited@example.com',
          role: 'member',
        },
      }

      expect(entry.metadata?.email).toBe('invited@example.com')
    })

    it('allows optional ipAddress', () => {
      const entry: AuditLogEntry = {
        organizationId: 'org-123',
        userId: 'user-456',
        event: AUDIT_EVENTS.TEAM_UPDATED,
        ipAddress: '192.168.1.1',
      }

      expect(entry.ipAddress).toBe('192.168.1.1')
    })

    it('allows optional userAgent', () => {
      const entry: AuditLogEntry = {
        organizationId: 'org-123',
        userId: 'user-456',
        event: AUDIT_EVENTS.TEAM_UPDATED,
        userAgent: 'Mozilla/5.0',
      }

      expect(entry.userAgent).toBe('Mozilla/5.0')
    })
  })

  describe('audit entry serialization', () => {
    it('serializes metadata to JSON', () => {
      const metadata = {
        oldName: 'Old Team',
        newName: 'New Team',
        changedBy: 'user-123',
      }

      const serialized = JSON.stringify(metadata)
      const parsed = JSON.parse(serialized) as typeof metadata

      expect(parsed.oldName).toBe('Old Team')
      expect(parsed.newName).toBe('New Team')
    })

    it('handles empty metadata', () => {
      const serialized = JSON.stringify({})
      const parsed = JSON.parse(serialized) as Record<string, unknown>

      expect(Object.keys(parsed).length).toBe(0)
    })

    it('handles nested metadata', () => {
      const metadata = {
        changes: {
          name: { from: 'Old', to: 'New' },
          slug: { from: 'old-slug', to: 'new-slug' },
        },
      }

      const serialized = JSON.stringify(metadata)
      const parsed = JSON.parse(serialized) as typeof metadata

      expect(parsed.changes.name.from).toBe('Old')
      expect(parsed.changes.name.to).toBe('New')
    })
  })

  describe('event naming conventions', () => {
    it('all events follow dot notation', () => {
      const events = Object.values(AUDIT_EVENTS)
      for (const event of events) {
        expect(event).toMatch(/^[a-z]+\.[a-z_]+$/)
      }
    })

    it('team events start with team.', () => {
      expect(AUDIT_EVENTS.TEAM_CREATED).toMatch(/^team\./)
      expect(AUDIT_EVENTS.TEAM_UPDATED).toMatch(/^team\./)
      expect(AUDIT_EVENTS.TEAM_DELETED).toMatch(/^team\./)
      expect(AUDIT_EVENTS.MEMBER_INVITED).toMatch(/^team\./)
    })

    it('project events start with project.', () => {
      expect(AUDIT_EVENTS.PROJECT_CREATED).toMatch(/^project\./)
      expect(AUDIT_EVENTS.PROJECT_MEMBER_ADDED).toMatch(/^project\./)
    })

    it('release events start with release.', () => {
      expect(AUDIT_EVENTS.RELEASE_CREATED).toMatch(/^release\./)
      expect(AUDIT_EVENTS.RELEASE_UPDATED).toMatch(/^release\./)
    })

    it('subscription events start with subscription.', () => {
      expect(AUDIT_EVENTS.SUBSCRIPTION_CREATED).toMatch(/^subscription\./)
      expect(AUDIT_EVENTS.SUBSCRIPTION_CANCELLED).toMatch(/^subscription\./)
    })
  })
})
