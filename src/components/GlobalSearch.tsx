import React, { useState, useEffect, useRef } from "react";
import { Search, X, User, Clock, FileText, Users, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCustomers, getHandlers, getEfforts, getCases, getShifts } from "@/lib/api";

interface SearchResult {
  id: number;
  type: 'customer' | 'handler' | 'effort' | 'case' | 'shift';
  title: string;
  subtitle: string;
  icon: string;
  data: any;
}

interface GlobalSearchProps {
  onResultSelect?: (result: SearchResult) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onResultSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const searchResults: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      // Sök parallellt i alla datatyper
      const [customers, handlers, efforts, cases, shifts] = await Promise.all([
        getCustomers(true).catch(() => []),
        getHandlers(true).catch(() => []),
        getEfforts().catch(() => []),
        getCases(true).catch(() => []),
        getShifts().catch(() => [])
      ]);

      // Sök i kunder
      customers.forEach(customer => {
        if (customer.initials.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: customer.id,
            type: 'customer',
            title: `Kund: ${customer.initials}`,
            subtitle: `${customer.gender}, född ${customer.birth_year}`,
            icon: 'User',
            data: customer,
          });
        }
      });

      // Sök i behandlare
      handlers.forEach(handler => {
        if (handler.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: handler.id,
            type: 'handler',
            title: `Behandlare: ${handler.name}`,
            subtitle: handler.email,
            icon: 'Users',
            data: handler,
          });
        }
      });

      // Sök i insatser
      efforts.forEach(effort => {
        if (effort.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: effort.id,
            type: 'effort',
            title: `Insats: ${effort.name}`,
            subtitle: `Tillgänglig för: ${effort.available_for}`,
            icon: 'FileText',
            data: effort,
          });
        }
      });

      // Sök i ärenden
      cases.forEach(caseItem => {
        if (caseItem.customer_name?.toLowerCase().includes(lowerQuery) ||
            caseItem.effort_name?.toLowerCase().includes(lowerQuery) ||
            caseItem.handler1_name?.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: caseItem.id,
            type: 'case',
            title: `Ärende: ${caseItem.customer_name || 'Okänd'} - ${caseItem.effort_name || 'Okänd'}`,
            subtitle: `Behandlare: ${caseItem.handler1_name || 'Okänd'}`,
            icon: 'FileText',
            data: caseItem,
          });
        }
      });

      // Sök i tider
      shifts.forEach(shift => {
        if (shift.customer_name?.toLowerCase().includes(lowerQuery) ||
            shift.effort_name?.toLowerCase().includes(lowerQuery) ||
            shift.date.includes(query)) {
          searchResults.push({
            id: shift.id,
            type: 'shift',
            title: `Tid: ${shift.customer_name || 'Okänd'} - ${shift.effort_name || 'Okänd'}`,
            subtitle: `${shift.date}, ${shift.hours}h, ${shift.status}`,
            icon: 'Clock',
            data: shift,
          });
        }
      });

      // Sortera efter relevans (enkel implementation)
      searchResults.sort((a, b) => {
        const aRelevance = calculateRelevance(a, query);
        const bRelevance = calculateRelevance(b, query);
        return bRelevance - aRelevance;
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Sökfel:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enkel relevansberäkning
  const calculateRelevance = (result: SearchResult, query: string): number => {
    const lowerQuery = query.toLowerCase();
    let relevance = 0;
    
    if (result.title.toLowerCase().includes(lowerQuery)) {
      relevance += 10;
    }
    
    if (result.subtitle.toLowerCase().includes(lowerQuery)) {
      relevance += 5;
    }
    
    if (result.title.toLowerCase().startsWith(lowerQuery)) {
      relevance += 3;
    }
    
    return relevance;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'handler': return 'bg-green-100 text-green-800';
      case 'effort': return 'bg-purple-100 text-purple-800';
      case 'case': return 'bg-orange-100 text-orange-800';
      case 'shift': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'Kund';
      case 'handler': return 'Behandlare';
      case 'effort': return 'Insats';
      case 'case': return 'Ärende';
      case 'shift': return 'Tid';
      default: return type;
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'User': return <User className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Clock': return <Clock className="w-4 h-4" />;
      case 'Calendar': return <Calendar className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
        <Input
          className="w-64 pl-12 pr-4 py-2 h-11 rounded-full border-1,75 border-gray-300 text-base placeholder:text-[#888888] focus:border-[#17694c] focus:ring-0"
          placeholder="Sök allt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => {
              setSearchQuery("");
              setResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sökresultat dropdown */}
      {isOpen && (searchQuery || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#17694c] mx-auto mb-2"></div>
              Söker...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-gray-500">
                      {getIconComponent(result.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {result.title}
                        </span>
                        <Badge className={`text-xs ${getTypeBadgeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {result.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Inga resultat hittades för "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
