export interface PaymentOrder {
  id: number;
  work_id: number;
  work_name: string;
  company_name: string;
  reference: string;
  invoice_number: string;
  amount: string;
  status: "ready" | "processing" | "paid" | "in_review";
  is_example: boolean;
  can_pay: boolean;
  presentation_mode: boolean;
  unavailable_reason: string | null;
  checkout_id: string | null;
  checkout_status: string | null;
  can_resume: boolean;
  receipt_id: number | null;
  date: string | null;
}
export interface BankAccount {
  id: string;
  name: string;
  holder: string;
  number: string;
  balance: string;
}
export interface CheckoutSession {
  id: string;
  status:
    "created" | "processing" | "succeeded" | "failed" | "cancelled" | "expired";
  amount: string;
  currency: string;
  work_id: number;
  work_name: string;
  payment_id: number;
  reference: string;
  invoice_number: string;
  company_name: string;
  destination: string;
  accounts: BankAccount[];
  account: string | null;
  closing_balance: string | null;
  transaction: string | null;
  receipt_id: number | null;
  result_code: string | null;
  message: string | null;
  can_authorize: boolean;
  presentation_mode: boolean;
  checkout_url: string;
  return_url: string;
}
