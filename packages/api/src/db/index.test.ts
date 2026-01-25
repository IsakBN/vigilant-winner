import { describe, it, expect, vi } from 'vitest'
import { getDb } from './index'

describe('getDb', () => {
  it('creates a drizzle instance from D1 binding', () => {
    const mockD1 = {
      prepare: vi.fn(),
      batch: vi.fn(),
      exec: vi.fn(),
      dump: vi.fn(),
    } as unknown as D1Database

    const db = getDb(mockD1)

    expect(db).toBeDefined()
    expect(typeof db.select).toBe('function')
    expect(typeof db.insert).toBe('function')
    expect(typeof db.update).toBe('function')
    expect(typeof db.delete).toBe('function')
  })
})
