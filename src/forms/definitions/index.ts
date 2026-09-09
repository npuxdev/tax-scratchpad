import type { FormDefinition, TaxFormType } from '../../tax/types'
import { basicsDefinition } from './basics'
import { form1099DivDefinition } from './1099-div'
import { form1099IntDefinition } from './1099-int'
import { form1099NecDefinition } from './1099-nec'
import { scheduleADefinition } from './schedule-a'
import { scheduleCDefinition } from './schedule-c'
import { w2Definition } from './w2'

export const FORM_DEFINITIONS: Record<TaxFormType, FormDefinition> = {
  W2: w2Definition,
  '1099_INT': form1099IntDefinition,
  '1099_DIV': form1099DivDefinition,
  '1099_NEC': form1099NecDefinition,
  SCHEDULE_C: scheduleCDefinition,
  SCHEDULE_A: scheduleADefinition,
  BASICS: basicsDefinition,
}

export function getFormDefinition(type: TaxFormType): FormDefinition {
  return FORM_DEFINITIONS[type]
}

export {
  basicsDefinition,
  form1099DivDefinition,
  form1099IntDefinition,
  form1099NecDefinition,
  scheduleADefinition,
  scheduleCDefinition,
  w2Definition,
}
