import { describe, it, expect } from 'vitest'
import { getTableName } from 'drizzle-orm'
import { user, session, account, verification } from './auth-schema'

describe('auth-schema', () => {
  describe('user table', () => {
    it('has correct table name', () => {
      expect(getTableName(user)).toBe('user')
    })

    it('has required columns', () => {
      const columns = Object.keys(user)
      expect(columns).toContain('id')
      expect(columns).toContain('email')
      expect(columns).toContain('emailVerified')
      expect(columns).toContain('name')
      expect(columns).toContain('image')
      expect(columns).toContain('createdAt')
      expect(columns).toContain('updatedAt')
    })
  })

  describe('session table', () => {
    it('has correct table name', () => {
      expect(getTableName(session)).toBe('session')
    })

    it('has required columns', () => {
      const columns = Object.keys(session)
      expect(columns).toContain('id')
      expect(columns).toContain('userId')
      expect(columns).toContain('token')
      expect(columns).toContain('expiresAt')
      expect(columns).toContain('ipAddress')
      expect(columns).toContain('userAgent')
    })
  })

  describe('account table', () => {
    it('has correct table name', () => {
      expect(getTableName(account)).toBe('account')
    })

    it('has required columns', () => {
      const columns = Object.keys(account)
      expect(columns).toContain('id')
      expect(columns).toContain('userId')
      expect(columns).toContain('accountId')
      expect(columns).toContain('providerId')
      expect(columns).toContain('accessToken')
      expect(columns).toContain('password')
    })
  })

  describe('verification table', () => {
    it('has correct table name', () => {
      expect(getTableName(verification)).toBe('verification')
    })

    it('has required columns', () => {
      const columns = Object.keys(verification)
      expect(columns).toContain('id')
      expect(columns).toContain('identifier')
      expect(columns).toContain('value')
      expect(columns).toContain('expiresAt')
    })
  })
})
