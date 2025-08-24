export const API_URL = import.meta.env.VITE_API_URL;
import { Customer, Handler, Effort, CaseWithNames, ShiftEntry } from "@/types/types";
import { api } from "./apiClient";

export async function getCustomers(all = false): Promise<Customer[]> {
  const res = await api(`/customers${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error("Kunde inte hämta kunder");
  const data = await res.json();
  return data.map((c: Customer) => ({
    ...c,
    birthYear: c.birth_year,
  }));
}

console.log("API_URL:", API_URL);
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

export async function createCustomer(data: { initials: string; gender: string; birthYear: number; startDate?: string }): Promise<Customer> {
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

export async function getCustomer(id: string): Promise<Customer & { birthYear: number }> {
  const res = await api(`/customers/${id}`);
  if (!res.ok) throw new Error("Kunde inte hämta kund");
  const c = await res.json();
  return {
    ...c,
    birthYear: c.birth_year,
  };
}

export async function updateCustomer(id: string, data: { initials: string; gender: string; birthYear: number; active: boolean; startDate: string }): Promise<Customer> {
  const res = await api(`/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initials: data.initials,
      gender: data.gender,
      birthYear: data.birthYear,
      active: data.active,
      startDate: data.startDate
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

export async function getCustomerEfforts(customerId: number) {
  const res = await api(`/cases?customer_id=${customerId}`);
  if (!res.ok) {
    throw new Error(`Kunde inte hämta insatser för kund ${customerId}`);
  }
  const data = await res.json();
  return data;
}

export async function getCustomerCases(customerId: number) {
  const res = await api(`/cases?customer_id=${customerId}`);
  if (!res.ok) {
    throw new Error(`Kunde inte hämta ärenden för kund ${customerId}`);
  }
  return res.json();
}

export async function getCasesForCustomerEffort(customerId: string, effortId: string): Promise<CaseWithNames[]> {
  const res = await api(`/cases?customer_id=${customerId}&effort_id=${effortId}`);
  if (!res.ok) throw new Error("Kunde inte hämta ärenden för kund och insats");
  return res.json();
}

export async function getCases(all = false): Promise<CaseWithNames[]> {
  const res = await api(`/cases${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error("Kunde inte hämta ärenden");
  const data = await res.json();
  return data;
}

// Ny funktion för att hämta aktiva ärenden för en specifik kund
export async function getActiveCasesByCustomer(customerId: number): Promise<CaseWithNames[]> {
  const res = await api(`/cases?customer_id=${customerId}&active=true`);
  if (!res.ok) throw new Error("Kunde inte hämta ärenden för kund");
  return res.json();
}

// Ny funktion för att skapa nytt ärende
export async function createCase(data: { customer_id: number; effort_id: number; handler1_id: number; handler2_id?: number | null; active?: boolean }): Promise<CaseWithNames> {
  const res = await api(`/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Kunde inte skapa ärende");
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
    throw new Error(errorData.error || "Kunde inte uppdatera ärende");
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
  if (!res.ok) throw new Error("Kunde inte hämta besök för ärendet");
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

export async function getStatsSummary(params?: { from?: string; to?: string; insats?: string; gender?: string; birthYear?: string; handler?: string; customer?: string }): Promise<any> {
  let url = `/stats/summary`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik");
  return res.json();
}

export async function getStatsByEffort(params?: { from?: string; to?: string; insats?: string; gender?: string; birthYear?: string; handler?: string; customer?: string }): Promise<any> {
  let url = `/stats/by-effort`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if (params.gender) search.append('gender', params.gender);
    if (params.birthYear) search.append('birthYear', params.birthYear);
    if (params.handler) search.append('handler', params.handler);
    if (params.customer) search.append('customer', params.customer);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per insats");
  return res.json();
}

export async function getStatsByMonth(params?: { from?: string; to?: string; insats?: string }): Promise<any> {
  let url = `/stats/by-month`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per månad");
  return res.json();
}

export async function getStatsByHandler(params?: { from?: string; to?: string; insats?: string }): Promise<any> {
  let url = `/stats/by-handler`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await api(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per behandlare");
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
