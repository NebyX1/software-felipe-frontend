export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id: number | null;
}
export interface Metric {
  certified: string;
  paid: string;
  physical_percent: string;
  planned_percent: string;
  formula: string;
  contract_base: string;
  physical_base: string;
  overdue_tasks: number;
}
export interface Work {
  id: number;
  version: number;
  code: string;
  name: string;
  description: string;
  stage: string;
  status: string;
  locality: string;
  location: string;
  intervention_type: string;
  objective: string;
  surface: string;
  budget: string;
  latitude: string;
  longitude: string;
  start_date: string;
  end_date: string;
  company_id: number | null;
  unit_id: number | null;
  public: boolean;
  funding: { name: string; amount: string }[];
  cover_id: number | null;
  metrics?: Metric;
}
export interface Actor {
  id: number;
  user_id: number | null;
  professional_id: number | null;
  name: string;
  role: string;
  contact: Record<string, string>;
}
export interface Line {
  id?: number;
  code: string;
  chapter: string;
  description: string;
  unit: string;
  quantity: string;
  unit_price: string;
  social_rate: string;
  kind: string;
  icc_eligible: boolean;
}
export interface Contract {
  id: number;
  version: number;
  kind: string;
  status: string;
  company_id: number | null;
  number: string;
  tender_number: string;
  dossier_number: string;
  procurement_type: string;
  bps_number: string;
  start_date: string;
  end_date: string;
  reason: string;
  amount: string;
  lines: Line[];
  rules: {
    iva_rate: string;
    social_payment: string;
    icc_initial?: string;
    contingency_limit?: string;
  };
}
export interface Doc {
  id: number;
  group_id: string;
  version: number;
  name: string;
  mime: string;
  kind: string;
  stage: string;
  classification: string;
  status: string;
  ingestion: string;
  ingestion_error: string;
  sha256: string;
  pages: number;
  author_id: number;
  created_at: string;
  company_id: number | null;
}
export interface Note {
  id: number;
  page: number;
  x: string;
  y: string;
  text: string;
  author_id: number;
}
export interface WorkRecord {
  id: number;
  version: number;
  kind: string;
  title: string;
  status: string;
  date: string;
  due_date: string;
  responsible_id: number | null;
  author_id: number;
  data: {
    description?: string;
    type?: string;
    frequency?: string;
    priority?: string;
    new_end_date?: string;
    definitive_date?: string;
    document_ids?: number[];
    comments?: {
      actor_id: number;
      date: string;
      text: string;
      status: string;
      document_ids: number[];
    }[];
    [key: string]: unknown;
  };
}
export interface Schedule {
  id: number;
  version: number;
  status: string;
  kind: string;
  reason: string;
  activities: Activity[];
}
export interface Activity {
  title: string;
  start: string;
  end: string;
  responsible_id: number;
  code?: string;
  milestone?: boolean;
}
export interface Calc {
  lines: (Line & {
    previous: string;
    period: string;
    accumulated: string;
    amount: string;
    social: string;
  })[];
  base: string;
  iva: string;
  social: string;
  adjustment: string;
  adjustment_iva: string;
  payable: string;
  social_payment: string;
  rounding: string;
  icc_base: string;
  icc_initial: string;
  icc_current: string;
  groups: Record<string, string>;
}
export interface Cert {
  id: number;
  version: number;
  revision: number;
  period: string;
  start_date: string;
  end_date: string;
  status: string;
  mode: string;
  input: { advances: Record<string, string>; icc_current: string };
  calculation: Calc;
  approved_snapshot: Record<string, unknown> | null;
  invoice_id: number | null;
  invoice_number: string | null;
  certificate_document_id: number | null;
  payment_document_id: number | null;
}
export interface Payment {
  id: number;
  version: number;
  certificate_id: number;
  reference: string;
  status: string;
  amount: string;
  demo: boolean;
  confirmation: Record<string, unknown> | null;
}
export interface Reference {
  companies: { id: number; name: string; status: string }[];
  units: { id: number; name: string }[];
  users: { id: number; name: string; role: string; unit_id?: number }[];
  catalog: {
    id: number;
    kind: string;
    code: string;
    label: string;
    data: Record<string, string>;
  }[];
}
export interface Source {
  id: number;
  document_id: number;
  name: string;
  version: number;
  page: number;
  text?: string;
  sha256: string;
}
export interface Turn {
  id: number;
  query: string;
  answer: string;
  status: string;
  sources: Source[];
  error_code: string | null;
}
export interface ImportBatch {
  id: number;
  status: string;
  sha256: string;
  preview: {
    kind: string;
    sheet: string;
    mode_hint: string;
    rows: Record<string, string>[];
    warnings: string[];
    errors: string[];
    notice: string;
  };
}
