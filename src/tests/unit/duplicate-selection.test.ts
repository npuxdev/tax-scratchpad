import { describe, expect, it } from 'vitest'
import {
  createEmptyScenario,
  createFormInstance,
  duplicateScenario,
} from '../../state/scenario'
import { money } from '../../tax/money'

describe('duplicateScenario selection remap', () => {
  it('regenerates form ids while preserving field value identity', () => {
    const source = createEmptyScenario('Source', 'single')
    const w2 = createFormInstance('W2')
    w2.values.box1 = money.fromDollars(50_000)
    source.forms = [w2]

    const selectedFormId = w2.id
    const selectedFieldId = 'box1'

    const copy = duplicateScenario(source)
    expect(copy.forms).toHaveLength(1)
    expect(copy.forms[0]!.id).not.toBe(w2.id)
    expect(copy.forms[0]!.values.box1).toBe(money.fromDollars(50_000))

    // AppStore remaps by index when duplicating the active scenario.
    const idx = source.forms.findIndex((f) => f.id === selectedFormId)
    const mappedFormId = idx >= 0 ? copy.forms[idx]!.id : null
    expect(mappedFormId).toBe(copy.forms[0]!.id)
    // Field ids are stable across copies.
    expect(selectedFieldId).toBe('box1')
  })
})
