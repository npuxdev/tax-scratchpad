import { describe, expect, it } from 'vitest'
import { humanizeKey, resolveDerivedLine } from '../../forms/derivedLines'

describe('humanizeKey', () => {
  it('splits camelCase keys', () => {
    expect(humanizeKey('qualifyingChildren')).toBe('Qualifying Children')
    expect(humanizeKey('additionalChildTaxCredit')).toBe(
      'Additional Child Tax Credit',
    )
  })
})

describe('resolveDerivedLine', () => {
  it('uses IRS line numbers and labels for Schedule 8812', () => {
    expect(resolveDerivedLine('schedule8812', 'qualifyingChildren')).toEqual(
      expect.objectContaining({
        no: '1',
        label: 'Qualifying children under age 17',
        dataType: 'number',
      }),
    )
    expect(
      resolveDerivedLine('schedule8812', 'additionalChildTaxCredit'),
    ).toEqual(
      expect.objectContaining({
        no: '27',
        label: 'Additional child tax credit',
        dataType: 'money',
        nodeId: 'schedule8812:actc',
      }),
    )
  })

  it('keeps numeric keys in the line-number column', () => {
    expect(resolveDerivedLine('schedule1', '15').no).toBe('15')
    expect(resolveDerivedLine('schedule1', '15').label).not.toBe('15')
  })

  it('falls back without duplicating camelCase into the number column', () => {
    const meta = resolveDerivedLine('unknown', 'netProfit')
    expect(meta.no).toBeUndefined()
    expect(meta.label).toBe('Net Profit')
  })
})
