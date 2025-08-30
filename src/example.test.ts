import { describe, it, expect } from 'vitest'

describe('math sanity check', () => {
  it('adds numbers correctly', () => {
    expect(1 + 2).toBe(3)
  })

  it('multiplies numbers correctly', () => {
    expect(2 * 5).toBe(10)
  })
})
