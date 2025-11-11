const fallbackApiUrl = (() => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/api`;
  }
  return 'http://localhost:4000/api';
})();

export const API_URL = import.meta.env.VITE_API_URL || fallbackApiUrl;
import { Customer, Handler, Effort, CaseWithNames, ShiftEntry, GlobalSearchResult, StatsSummary } from "@/types/types";
import { api } from "./apiClient";

type QueryValue = string | number | boolean | null | undefined;

const appendQueryParams = (params: URLSearchParams, values?: Record<string, QueryValue>) => {
  if (!values) return;
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean") {
      params.append(key, value ? "true" : "false");
    } else {
      params.append(key, String(value));
    }
  }
};

export async function getCustomers(all = false): Promise<Customer[]> {
  const res = await api(`/customers${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error("Kunde inte hämta kunder");
  const data = await res.json();
  return data.map((c: Customer) => ({
    ...c,
    birthYear: c.birth_year ?? null,
    isGroup: c.is_group ?? false,
  }));
}

export async function protectCustomer(id: number): Promise<{ id: number; is_protected: boolean }> {
  const res = await api(`/customers/${id}/protect`, { method: 'POST' });
  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err?.message || err?.error || 'Kunde inte märka kund som skyddad');
    } catch {
      throw new Error('Kunde inte märka kund som skyddad');
    }
  }
  return res.json();
}

export async function unprotectCustomer(id: number): Promise<{ id: number; is_protected: boolean }> {
  const res = await api(`/customers/${id}/unprotect`, { method: 'POST' });
  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err?.message || err?.error || 'Kunde inte ta bort skyddad markering');
    } catch {
      throw new Error('Kunde inte ta bort skyddad markering');
    }
  }
  return res.json();
}

export async function createCustomer(data: { initials: string; gender?: string; birthYear?: number; startDate?: string; isGroup?: boolean }): Promise<Customer> {
  const res = await api(`/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Kunde inte skapa kund");
  return res.json();
}

export async function softDeleteCustomer(id: string): Promise<Customer> {
  const res = await api(`/customers/${id}/deactivate`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    let msg = "Kunde inte avaktivera kund";
    try {
      const err = await res.json();
      if (err && err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function reactivateCustomer(id: string): Promise<Customer> {
  const res = await api(`/customers/${id}/activate`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    let msg = "Kunde inte återaktivera kund";
    try {
      const err = await res.json();
      if (err && err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getCustomer(id: string): Promise<Customer & { birthYear: number | null; isGroup?: boolean }> {
  const res = await api(`/customers/${id}`);
  if (!res.ok) throw new Error("Kunde inte hämta kund");
  const c = await res.json();
  return {
    ...c,
    birthYear: c.birth_year ?? null,
    isGroup: c.is_group ?? false,
  };
}

export async function getCustomerTotalHours(id: number): Promise<number> {
  const res = await api(`/customers/${id}/time`);
  if (!res.ok) {
    throw new Error("Kunde inte hämta kundens tid");
  }
  const data = await res.json();
  return Number(data?.totalHours ?? 0);
}

export async function updateCustomer(id: string, data: { initials: string; gender?: string; birthYear?: number; active: boolean; startDate: string; isGroup?: boolean }): Promise<Customer> {
  const res = await api(`/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initials: data.initials,
      gender: data.gender,
      birthYear: data.birthYear,
      active: data.active,
      startDate: data.startDate,
      isGroup: data.isGroup
    })
  });
  if (!res.ok) throw new Error("Kunde inte uppdatera kund");
  return res.json();
}

export async function getEfforts(): Promise<Effort[]> {
  const res = await api(`/efforts`);
  if (!res.ok) throw new Error("Kunde inte hämta insatser");
  return res.json();
}

export async function getCustomerEfforts(customerId: number, options?: { includeInactive?: boolean }) {
  const params = new URLSearchParams({ customer_id: String(customerId) });
  if (options?.includeInactive) {
    params.append('all', 'true');
  }
  const res = await api(`/cases?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Kunde inte hämta insatser för kund ${customerId}`);
  }
  const data = await res.json();
  return data;
}

export async function getCustomerCases(customerId: number) {
  const res = await api(`/cases?customer_id=${customerId}`);
  if (!res.ok) {
    throw new Error(`Kunde inte hämta insatsen för kund ${customerId}`);
  }
  return res.json();
}

export async function getCasesForCustomerEffort(customerId: string, effortId: string): Promise<CaseWithNames[]> {
  const res = await api(`/cases?customer_id=${customerId}&effort_id=${effortId}`);
  if (!res.ok) throw new Error("Kunde inte hämta insatsen för kund och insats");
  return res.json();
}

type GetCasesOptions = {
  params?: Record<string, QueryValue>;
  request?: RequestInit;
};

export async function getCases(all = false, options?: GetCasesOptions): Promise<CaseWithNames[]> {
  const searchParams = new URLSearchParams();
  if (all) {
    searchParams.append('all', 'true');
  }
  appendQueryParams(searchParams, options?.params);
  const query = searchParams.toString();
  const path = query ? `/cases?${query}` : `/cases`;
  const res = await api(path, options?.request);
  if (!res.ok) throw new Error("Kunde inte hämta insatsen");
  const data = await res.json();
  return data;
}

// Ny funktion för att hämta aktiva insatsen för en specifik kund
export async function getActiveCasesByCustomer(customerId: number): Promise<CaseWithNames[]> {
  const res = await api(`/cases?customer_id=${customerId}&active=true`);
  if (!res.ok) throw new Error("Kunde inte hämta insatsen för kund");
  return res.json();
}

// Ny funktion för att skapa nytt insats
export async function createCase(data: { customer_id: number; effort_id: number; handler1_id: number; handler2_id?: number | null; active?: boolean }): Promise<CaseWithNames> {
  const res = await api(`/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Kunde inte skapa insats");
  }
  return res.json();
}

export async function updateCase(
  id: string,
  data: { customer_id: string; effort_id: string; handler1_id: string; handler2_id?: string | null; active?: boolean }
): Promise<CaseWithNames> {
  const res = await api(`/cases/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Kunde inte uppdatera insats");
  }
  return res.json();
}

// Uppdaterad addShift - case-centrerad och strikt
export async function addShift(data: { case_id: number; date: string; hours: number; status: "Utförd"|"Avbokad" }): Promise<ShiftEntry> {
  if (!data.case_id) throw new Error("case_id krävs");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error("Ogiltigt datumformat");
  if (!(data.hours > 0)) throw new Error("Timmar måste vara > 0");
  if (data.status !== "Utförd" && data.status !== "Avbokad") throw new Error("Ogiltig status");
  
  const res = await api(`/shifts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Kunde inte skapa besök: ${errorText}`);
  }
  return res.json();
}

export async function getShifts(): Promise<ShiftEntry[]> {
  const res = await api(`/shifts`);
  if (!res.ok) throw new Error("Kunde inte hämta besök");
  return res.json();
}

export async function getShiftsForCase(caseId: string): Promise<ShiftEntry[]> {
  const res = await api(`/shifts?case_id=${caseId}`);
  if (!res.ok) throw new Error("Kunde inte hämta besök för insats");
  return res.json();
}

export async function updateShift(id: string, data: { date: string; hours: number; status: string }): Promise<ShiftEntry> {
  // Validera att hours är positivt
  if (data.hours <= 0 || isNaN(data.hours)) {
    throw new Error("Timmar måste vara ett positivt nummer");
  }
  
  // Validera datum-format
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error("Ogiltigt datum-format. Använd YYYY-MM-DD");
  }
  
  const res = await api(`/shifts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Kunde inte uppdatera besök: ${errorText}`);
  }
  return res.json();
}

// Inaktivera alla shifts som tillhör ett specifikt case (soft delete - INGEN permanent radering!)
export async function deactivateShiftsForCase(caseId: string): Promise<{ message: string; deactivatedCount: number }> {
  const res = await api(`/shifts/case/${caseId}/deactivate`, {
    method: "PUT"
  });
  if (!res.ok) throw new Error("Kunde inte inaktivera shifts för case");
  return res.json();
}

export async function getStatsSummary(
  params?: { from?: string; to?: string; insats?: string; effortCategory?: string; gender?: string; birthYear?: string; handler?: string; customer?: string; includeInactive?: boolean; shiftStatus?: 'Alla' | 'Utförd' | 'Avbokad' },
  options?: RequestInit
): Promise<StatsSummary> {
  let url = `/stats/summary`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.effortCategory) search.append('effortCategory', params.effortCategory);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if (params.shiftStatus) search.append('shiftStatus', params.shiftStatus);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta statistik");
  return res.json() as Promise<StatsSummary>;
}

export async function getStatsByEffort(
  params?: { from?: string; to?: string; insats?: string; effortCategory?: string; gender?: string; birthYear?: string; handler?: string; customer?: string; includeInactive?: boolean; shiftStatus?: 'Alla' | 'Utförd' | 'Avbokad' },
  options?: RequestInit
): Promise<any> {
  let url = `/stats/by-effort`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.effortCategory) search.append('effortCategory', params.effortCategory);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if (params.shiftStatus) search.append('shiftStatus', params.shiftStatus);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per insats");
  return res.json();
}

export async function getStatsByHandler(
  params?: { from?: string; to?: string; insats?: string; effortCategory?: string; gender?: string; birthYear?: string; handler?: string; customer?: string; includeInactive?: boolean; shiftStatus?: 'Alla' | 'Utförd' | 'Avbokad' },
  options?: RequestInit
): Promise<any> {
  let url = `/stats/by-handler`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.effortCategory) search.append('effortCategory', params.effortCategory);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if (params.shiftStatus) search.append('shiftStatus', params.shiftStatus);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per behandlare");
  return res.json();
}

export async function searchAll(query: string, perType?: number): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({ q: trimmed });
  if (perType) params.append('perType', String(perType));

  const res = await api(`/search?${params.toString()}`);
  if (!res.ok) {
    const message = await res.text().catch(() => null);
    throw new Error(message || "Kunde inte söka");
  }
  return res.json();
}

export async function getStatsByGender(
  params?: { from?: string; to?: string; insats?: string; effortCategory?: string; gender?: string; birthYear?: string; handler?: string; customer?: string; includeInactive?: boolean; shiftStatus?: 'Alla' | 'Utförd' | 'Avbokad' },
  options?: RequestInit
): Promise<any> {
  let url = `/stats/by-gender`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.effortCategory) search.append('effortCategory', params.effortCategory);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if (params.shiftStatus) search.append('shiftStatus', params.shiftStatus);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per kön");
  return res.json();
}

export async function getStatsByBirthYear(
  params?: { from?: string; to?: string; insats?: string; effortCategory?: string; gender?: string; birthYear?: string; handler?: string; customer?: string; includeInactive?: boolean; shiftStatus?: 'Alla' | 'Utförd' | 'Avbokad' },
  options?: RequestInit
): Promise<any> {
  let url = `/stats/by-birthyear`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.effortCategory) search.append('effortCategory', params.effortCategory);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if (params.shiftStatus) search.append('shiftStatus', params.shiftStatus);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per födelseår");
  return res.json();
}

export async function getStatsCases(
  params?: { from?: string; to?: string; insats?: string; effortCategory?: string; gender?: string; birthYear?: string; handler?: string; customer?: string; includeInactive?: boolean; shiftStatus?: 'Alla' | 'Utförd' | 'Avbokad' },
  options?: RequestInit
): Promise<any[]> {
  let url = `/stats/cases`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.effortCategory) search.append('effortCategory', params.effortCategory);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if (params.shiftStatus) search.append('shiftStatus', params.shiftStatus);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta ärenden");
  return res.json();
}
export async function getStatsRaw(
  params?: { from?: string; to?: string; insats?: string; effortCategory?: string; gender?: string; birthYear?: string; handler?: string; customer?: string; includeInactive?: boolean; shiftStatus?: 'Alla' | 'Utförd' | 'Avbokad' },
  options?: RequestInit
): Promise<any[]> {
  let url = `/stats/raw`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.effortCategory) search.append('effortCategory', params.effortCategory);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if (params.shiftStatus) search.append('shiftStatus', params.shiftStatus);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta detaljerad statistik");
  return res.json();
}

export async function getStatsByMonth(
  params?: { from?: string; to?: string; insats?: string; includeInactive?: boolean },
  options?: RequestInit
): Promise<any> {
  let url = `/stats/by-month`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.includeInactive) search.append('includeInactive', String(params.includeInactive));
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url, options);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per månad");
  return res.json();
}

export async function getHandlers(all = false): Promise<Handler[]> {
  const res = await api(`/handlers${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error("Kunde inte hämta behandlare");
  return res.json();
}

export interface HandlerPublic {
  id: string;
  name: string;
}

export const getPublicHandlers = async (): Promise<HandlerPublic[]> => {
  const response = await api(`/handlers/public`);
  return response.json();
};
