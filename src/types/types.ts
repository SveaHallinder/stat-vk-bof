export interface Customer {
  id: number;
  initials: string;
  gender: string;
  birth_year: number;
  created_at: string;
  active: boolean;
}

export interface Effort {
  id: number;
  name: string;
  available_for: string;
  active: boolean;
}

export interface Handler {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export interface Invite {
  id: number;
  handler_id: number;
  email: string;
  token: string;
  created_at: string;
  used: boolean;
}

export interface CaseBase {
  id: number;
  customer_id: number;
  effort_id: number;
  handler1_id: number;
  handler2_id: number | null;
  active: boolean;
  created_at: string;
}

export interface CaseWithNames extends CaseBase {
  customer_name: string;   // customers.initials
  customer_active?: boolean; // customers.active (för UI)
  effort_name: string;     // efforts.name
  handler1_name: string;   // handlers.name
  handler2_name: string | null;
}

export interface Shift {
  id: number;
  case_id: number;
  date: string;
  hours: number;
  status: string;
  active: boolean;
}

export interface ShiftEntry {
  id: number;
  case_id: number;
  customer_id?: number;
  date: string;         // 'YYYY-MM-DD'
  hours: number;
  status: string;       // 'Utförd' | 'Avbokad' | ...
  active: boolean;
  // bekvämlighetsfält i listor
  customer_name?: string;
  customer_active?: boolean;
  effort_name?: string;
  handler1_name?: string;
  handler2_name?: string | null;
}

// Vallentuna kommun specifika status-värden
export type ShiftStatus = "Utförd" | "Avbokad";
  
