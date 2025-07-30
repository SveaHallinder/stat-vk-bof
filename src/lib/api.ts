export const API_URL = import.meta.env.VITE_API_URL;

export async function getCustomers(all = false) {
  const res = await fetch(`${API_URL}/customers${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error("Kunde inte hämta kunder");
  const data = await res.json();
  // Mappa om birth_year till birthYear
  return data.map((c: any) => ({
    ...c,
    birthYear: c.birth_year,
  }));
}

export async function createCustomer(data: { initials: string; gender: string; birthYear: number; startDate?: string }) {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Kunde inte skapa kund");
  return res.json();
}

export async function softDeleteCustomer(id: string) {
  const res = await fetch(`${API_URL}/customers/${id}/deactivate`, {
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

export async function reactivateCustomer(id: string) {
  const res = await fetch(`${API_URL}/customers/${id}/activate`, {
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

export async function getCustomer(id: string) {
  const res = await fetch(`${API_URL}/customers/${id}`);
  if (!res.ok) throw new Error("Kunde inte hämta kund");
  const c = await res.json();
  // Mappa om birth_year till birthYear
  return {
    ...c,
    birthYear: c.birth_year,
  };
}

export async function updateCustomer(id: string, data: { initials: string; gender: string; birthYear: number; active: boolean; startDate: string }) {
  const res = await fetch(`${API_URL}/customers/${id}`, {
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

export async function getEfforts() {
  const res = await fetch(`${API_URL}/efforts`);
  if (!res.ok) throw new Error("Kunde inte hämta insatser");
  return res.json();
}

export async function getCustomerEfforts(customerId: string) {
  const res = await fetch(`${API_URL}/customers/${customerId}/efforts`);
  if (!res.ok) throw new Error("Kunde inte hämta insatser för kund");
  return res.json();
}

export async function getCasesForCustomerEffort(customerId: string, effortId: string) {
  const res = await fetch(`${API_URL}/customers/${customerId}/efforts/${effortId}/cases`);
  if (!res.ok) throw new Error("Kunde inte hämta ärenden för kund och insats");
  return res.json();
}

export async function updateCase(
  id: string,
  data: { customer_id: string; effort_id: string; date: string; handler1_id: string; handler2_id?: string; hours: string; status: string }
) {
  const res = await fetch(`${API_URL}/cases/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Kunde inte uppdatera ärende");
  return res.json();
}

export async function getStatsSummary(params?: { from?: string; to?: string; insats?: string; gender?: string; birthYear?: string; handler?: string; customer?: string }) {
  let url = `${API_URL}/stats/summary`;
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
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik");
  return res.json();
}

export async function getStatsByEffort(params?: { from?: string; to?: string; insats?: string; gender?: string; birthYear?: string; handler?: string; customer?: string }) {
  let url = `${API_URL}/stats/by-effort`;
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
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per insats");
  return res.json();
}

export async function getStatsByMonth(params?: { from?: string; to?: string; insats?: string }) {
  let url = `${API_URL}/stats/by-month`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per månad");
  return res.json();
}

export async function getStatsByHandler(params?: { from?: string; to?: string; insats?: string }) {
  let url = `${API_URL}/stats/by-handler`;
  if (params) {
    const search = new URLSearchParams();
    if (params.from) search.append('from', params.from);
    if (params.to) search.append('to', params.to);
    if (params.insats) search.append('insats', params.insats);
    if ([...search].length > 0) url += `?${search.toString()}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunde inte hämta statistik per behandlare");
  return res.json();
}

export async function getHandlers(all = false) {
  const res = await fetch(`${API_URL}/handlers${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error("Kunde inte hämta behandlare");
  return res.json();
}