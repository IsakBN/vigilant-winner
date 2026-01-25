import { describe, it, expect } from 'vitest'
import { isAdmin } from './auth'

describe('isAdmin', () => {
  it('returns true for @bundlenudge.com emails', () => {
    expect(isAdmin('admin@bundlenudge.com')).toBe(true)
    expect(isAdmin('test@bundlenudge.com')).toBe(true)
    expect(isAdmin('support@bundlenudge.com')).toBe(true)
  })

  it('returns false for other email domains', () => {
    expect(isAdmin('user@gmail.com')).toBe(false)
    expect(isAdmin('admin@example.com')).toBe(false)
    expect(isAdmin('test@bundlenudge.org')).toBe(false)
  })

  it('returns false for null or undefined', () => {
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isAdmin('')).toBe(false)
  })

  it('handles emails with subdomains', () => {
    expect(isAdmin('admin@subdomain.bundlenudge.com')).toBe(false)
    expect(isAdmin('admin@mail.bundlenudge.com')).toBe(false)
  })

  it('is case-sensitive for domain check', () => {
    expect(isAdmin('admin@BUNDLENUDGE.com')).toBe(false)
    expect(isAdmin('admin@BundleNudge.com')).toBe(false)
  })
})
