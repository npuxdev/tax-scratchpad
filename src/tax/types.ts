import type { Cents } from "./money";

export type { Cents };

export type TaxYear = 2025;
export type RuleSet = "federal-2025-v1";
export type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household";
export type CoverageStatus = "exact" | "needs-input" | "unsupported";

export type TaxFormType =
  | "W2"
  | "1099_INT"
  | "1099_DIV"
  | "1099_NEC"
  | "SCHEDULE_C"
  | "SCHEDULE_A"
  | "BASICS";

export type CalculationUse = "supported" | "informational" | "unsupported-trigger";

export type FieldDataType =
  | "money"
  | "text"
  | "boolean"
  | "date"
  | "enum"
  | "number";

export interface CoverageIssue {
  id: string;
  status: "needs-input" | "unsupported";
  message: string;
  formId?: string;
  fieldId?: string;
}

export interface CoverageResult {
  status: CoverageStatus;
  issues: CoverageIssue[];
}

export interface SourceAuthority {
  authority: "IRS";
  taxYear: TaxYear;
  document: string;
  section?: string;
}

export type CalculationKind =
  | "input"
  | "sum"
  | "difference"
  | "minimum"
  | "maximum"
  | "percentage"
  | "lookup"
  | "credit"
  | "derived"
  | "worksheet";

export interface CalculationNode {
  id: string;
  label: string;
  value: Cents | null;
  kind: CalculationKind;
  inputs: string[];
  destination?: { form: string; line: string };
  rule?: string;
  sourceAuthority?: SourceAuthority;
  detail?: string;
  children?: Array<{ label: string; value: Cents; nodeId?: string }>;
}

export interface CalculationGraph {
  nodes: Record<string, CalculationNode>;
}

export interface Dependent {
  id: string;
  name?: string;
  relationship: string;
  ageAtEndOf2025: number;
  livedWithTaxpayerMoreThanHalfYear: boolean;
  providedMoreThanHalfOwnSupport: boolean;
  claimedAsDependent: boolean;
  citizenNationalOrResidentAlien: boolean;
  validEmploymentSSN: boolean;
}

export interface TaxpayerBasics {
  filingStatus: FilingStatus;
  taxpayerName?: string;
  spouseName?: string;
  taxpayerAgeAtEndOfYear: number;
  spouseAgeAtEndOfYear?: number;
  taxpayerBlind: boolean;
  spouseBlind: boolean;
  taxpayerHasValidEmploymentSSN: boolean;
  spouseHasValidSSNOrITIN: boolean;
}

export type FieldValue = Cents | string | boolean | number | null;

export interface TaxFormInstance {
  id: string;
  type: TaxFormType;
  label: string;
  owner?: "taxpayer" | "spouse";
  values: Record<string, FieldValue>;
  relationships?: {
    scheduleCId?: string;
  };
}

export interface TaxScenario {
  id: string;
  name: string;
  schemaVersion: 1;
  taxYear: TaxYear;
  ruleSet: RuleSet;
  createdAt: string;
  updatedAt: string;
  basics: TaxpayerBasics;
  dependents: Dependent[];
  forms: TaxFormInstance[];
  estimatedPayments: Cents;
}

export interface FormFieldDefinition {
  id: string;
  box?: string;
  label: string;
  dataType: FieldDataType;
  calculationUse: CalculationUse;
  mapsTo?: string[];
  editable?: boolean;
}

export interface FormDefinition {
  type: TaxFormType;
  title: string;
  formNumber: string;
  taxYear: TaxYear;
  fields: FormFieldDefinition[];
}

export interface Federal2025Totals {
  income: Cents;
  adjustments: Cents;
  agi: Cents;
  deductions: Cents;
  deductionType: "standard" | "itemized";
  taxableIncome: Cents;
  incomeTax: Cents;
  nonrefundableCredits: Cents;
  selfEmploymentTax: Cents;
  additionalMedicareTax: Cents;
  totalTax: Cents;
  withholding: Cents;
  estimatedPayments: Cents;
  refundableCredits: Cents;
  totalPayments: Cents;
  /** Positive = refund owed to taxpayer. */
  refundOrDue: Cents;
}

export interface DerivedFormValues {
  form1040: Record<string, Cents | string | null>;
  schedule1: Record<string, Cents | null>;
  schedule2: Record<string, Cents | null>;
  scheduleA: Record<string, Cents | null>;
  /** Schedule C values keyed by Schedule C form instance id. */
  scheduleC: Record<string, Record<string, Cents | null>>;
  scheduleSE: Record<string, Cents | null>;
  schedule8812: Record<string, Cents | null>;
}

export interface Federal2025Result {
  coverage: CoverageResult;
  totals: Federal2025Totals;
  forms: DerivedFormValues;
  graph: CalculationGraph;
}

export interface Preferences {
  lastScenarioId?: string;
}
