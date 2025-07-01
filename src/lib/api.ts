const API_URL = import.meta.env.VITE_API_URL;

export async function getCustomers() {
  const res = await fetch(`${API_URL}/customers`);
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

export async function deleteCustomer(id: string) {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Kunde inte radera kund");
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