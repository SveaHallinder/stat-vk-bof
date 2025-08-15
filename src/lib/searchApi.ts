import { SearchResult } from './useGlobalSearch';

// API-endpoints för sökning
const SEARCH_ENDPOINTS = {
  customers: '/api/customers/search',
  handlers: '/api/handlers/search',
  efforts: '/api/efforts/search',
  cases: '/api/cases/search',
  shifts: '/api/shifts/search',
};

// Sökparametrar
export interface SearchParams {
  query: string;
  types?: string[];
  limit?: number;
}

// Global sökning som söker igenom alla typer av data
export const performGlobalSearch = async (params: SearchParams): Promise<SearchResult[]> => {
  try {
    const { query, types = ['customers', 'handlers', 'efforts', 'cases', 'shifts'], limit = 20 } = params;
    
    if (!query.trim()) {
      return [];
    }

    // Samla alla sökresultat från olika endpoints
    const allResults: SearchResult[] = [];
    
    // Sök parallellt i alla valda datatyper
    const searchPromises = types.map(async (type) => {
      try {
        const endpoint = SEARCH_ENDPOINTS[type as keyof typeof SEARCH_ENDPOINTS];
        if (!endpoint) return [];
        
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&limit=${Math.ceil(limit / types.length)}`);
        
        if (!response.ok) {
          console.warn(`Sökning i ${type} misslyckades:`, response.statusText);
          return [];
        }
        
        const data = await response.json();
        return transformSearchResults(data, type);
      } catch (error) {
        console.error(`Fel vid sökning i ${type}:`, error);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Kombinera alla resultat och sortera efter relevans
    results.forEach(resultArray => {
      allResults.push(...resultArray);
    });

    // Sortera efter relevans (enkel implementation - kan förbättras)
    allResults.sort((a, b) => {
      const aRelevance = calculateRelevance(a, query);
      const bRelevance = calculateRelevance(b, query);
      return bRelevance - aRelevance;
    });

    // Returnera begränsat antal resultat
    return allResults.slice(0, limit);
    
  } catch (error) {
    console.error('Fel vid global sökning:', error);
    return [];
  }
};

// Transformera API-data till SearchResult-format
const transformSearchResults = (data: any[], type: string): SearchResult[] => {
  switch (type) {
    case 'customers':
      return data.map(customer => ({
        id: customer.id,
        type: 'customer' as const,
        title: `Kund: ${customer.initials}`,
        subtitle: `${customer.gender}, född ${customer.birth_year}`,
        icon: 'User',
        data: customer,
      }));
      
    case 'handlers':
      return data.map(handler => ({
        id: handler.id,
        type: 'handler' as const,
        title: `Behandlare: ${handler.name}`,
        subtitle: handler.email,
        icon: 'Users',
        data: handler,
      }));
      
    case 'efforts':
      return data.map(effort => ({
        id: effort.id,
        type: 'effort' as const,
        title: `Insats: ${effort.name}`,
        subtitle: `Tillgänglig för: ${effort.available_for}`,
        icon: 'FileText',
        data: effort,
      }));
      
    case 'cases':
      return data.map(caseItem => ({
        id: caseItem.id,
        type: 'case' as const,
        title: `Ärende: ${caseItem.customer_name} - ${caseItem.effort_name}`,
        subtitle: `Behandlare: ${caseItem.handler1_name}`,
        icon: 'FileText',
        data: caseItem,
      }));
      
    case 'shifts':
      return data.map(shift => ({
        id: shift.id,
        type: 'shift' as const,
        title: `Tid: ${shift.customer_name} - ${shift.effort_name}`,
        subtitle: `${shift.date}, ${shift.hours}h, ${shift.status}`,
        icon: 'Clock',
        data: shift,
      }));
      
    default:
      return [];
  }
};

// Enkel relevansberäkning (kan förbättras med mer sofistikerad algoritm)
const calculateRelevance = (result: SearchResult, query: string): number => {
  const lowerQuery = query.toLowerCase();
  let relevance = 0;
  
  // Titel matchar - högst relevans
  if (result.title.toLowerCase().includes(lowerQuery)) {
    relevance += 10;
  }
  
  // Subtitle matchar - medel relevans
  if (result.subtitle.toLowerCase().includes(lowerQuery)) {
    relevance += 5;
  }
  
  // Exakt match i början - extra poäng
  if (result.title.toLowerCase().startsWith(lowerQuery)) {
    relevance += 3;
  }
  
  // Kortare resultat får lite extra poäng (troligen mer relevanta)
  if (result.title.length < 50) {
    relevance += 1;
  }
  
  return relevance;
};

// Snabbsökning för vanliga termer
export const quickSearch = async (query: string): Promise<SearchResult[]> => {
  // För vanliga termer kan vi använda en snabbare sökning
  const commonTerms = ['kund', 'behandlare', 'insats', 'tid', 'ärende'];
  const isCommonTerm = commonTerms.some(term => 
    query.toLowerCase().includes(term)
  );
  
  if (isCommonTerm) {
    // Använd snabbare sökning för vanliga termer
    return performGlobalSearch({ query, limit: 10 });
  }
  
  // Annars använd fullständig sökning
  return performGlobalSearch({ query, limit: 20 });
};
