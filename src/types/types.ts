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
  
  export interface Case {
    id: number;
    customer_id: number;
    handler1_id: number;
    handler2_id: number | null;
    effort_id: number;
    created_at: string;
    active: boolean;
  }
  
  export interface Visit {
    id: number;
    case_id: number;
    date: string;
    hours: number | null;
    status: string;
    created_at: string;
    active: boolean;
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
    date: string;
    hours: number;
    status: string;
    customer_name: string;
    effort_name: string;
    handler1_name: string;
    handler2_name: string;
  }
  