import { describe, it, expect } from 'vitest'
import { hasMinRole } from './team-permission'

describe('hasMinRole', () => {
  it('member meets member requirement', () => {
    expect(hasMinRole('member', 'member')).toBe(true)
  })

  it('admin meets member requirement', () => {
    expect(hasMinRole('admin', 'member')).toBe(true)
  })

  it('owner meets member requirement', () => {
    expect(hasMinRole('owner', 'member')).toBe(true)
  })

  it('member does not meet admin requirement', () => {
    expect(hasMinRole('member', 'admin')).toBe(false)
  })

  it('admin meets admin requirement', () => {
    expect(hasMinRole('admin', 'admin')).toBe(true)
  })

  it('owner meets admin requirement', () => {
    expect(hasMinRole('owner', 'admin')).toBe(true)
  })

  it('member does not meet owner requirement', () => {
    expect(hasMinRole('member', 'owner')).toBe(false)
  })

  it('admin does not meet owner requirement', () => {
    expect(hasMinRole('admin', 'owner')).toBe(false)
  })

  it('owner meets owner requirement', () => {
    expect(hasMinRole('owner', 'owner')).toBe(true)
  })
})
