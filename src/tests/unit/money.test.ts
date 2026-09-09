import { describe, it, expect } from 'vitest'
import { money } from '../../tax/money'

describe('money helpers', () => {
  it('converts dollars to integer cents', () => {
    expect(money.fromDollars(1234.56)).toBe(123_456)
    expect(money.fromDollars(0)).toBe(0)
    expect(money.fromDollars(56_800)).toBe(5_680_000)
  })

  it('adds and subtracts cents', () => {
    expect(money.add(100, 200, 300)).toBe(600)
    expect(money.subtract(500, 200)).toBe(300)
    expect(money.subtract(200, 500)).toBe(-300)
  })

  it('applies IRS whole-dollar rounding', () => {
    expect(money.roundIRS(149)).toBe(100) // $1.49 → $1
    expect(money.roundIRS(150)).toBe(200) // $1.50 → $2
    expect(money.roundIRS(199)).toBe(200)
    expect(money.roundIRS(0)).toBe(0)
    expect(money.roundIRS(-150)).toBe(-200)
  })

  it('multiplies by a rate and rounds to nearest cent', () => {
    expect(money.multiplyRate(10_000, 0.062)).toBe(620)
    expect(money.multiplyRate(4_617_500, 0.124)).toBe(572_570)
  })

  it('rounds a floating point cent quantity', () => {
    expect(money.roundNearestCent(133_907.5)).toBe(133_908)
    expect(money.roundNearestCent(133_907.4)).toBe(133_907)
  })

  it('min/max/abs', () => {
    expect(money.min(100, 200)).toBe(100)
    expect(money.max(100, 200)).toBe(200)
    expect(money.abs(-500)).toBe(500)
  })

  it('parses money strings', () => {
    expect(money.parse('$1,234.56')).toBe(123_456)
    expect(money.parse('(1,234.56)')).toBe(-123_456)
    expect(money.parse('')).toBeNull()
  })

  it('formats whole-dollar amounts', () => {
    expect(money.format(123_456)).toBe('$1,235')
    expect(money.format(-123_456)).toBe('-$1,235')
    expect(money.formatExact(123_456)).toBe('$1,234.56')
  })
})
