import { useState, useCallback } from 'react';

export interface SearchResult {
  id: number;
  type: 'customer' | 'handler' | 'effort' | 'case' | 'shift';
  title: string;
  subtitle: string;
  icon: string;
  data: any;
}

export const useGlobalSearch = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleResultSelect = useCallback((result: SearchResult) => {
    // Här kan du implementera logik för att hantera valda sökresultat
    
    // Exempel: Navigera till rätt sida baserat på resultattyp
    switch (result.type) {
      case 'customer':
        // Navigera till kundsida
        window.location.href = `/kunder/${result.id}`;
        break;
      case 'handler':
        // Navigera till behandlaresida
        window.location.href = `/admin/behandlare/${result.id}`;
        break;
      case 'effort':
        // Navigera till insatssida
        window.location.href = `/admin/insatser/${result.id}`;
        break;
      case 'case':
        // Navigera till ärendesida
        window.location.href = `/arendelista/${result.id}`;
        break;
      case 'shift':
        // Navigera till tidregistreringssida
        window.location.href = `/registrera-tid?shift=${result.id}`;
        break;
    }
    
    closeSearch();
  }, [closeSearch]);

  return {
    isSearchOpen,
    searchQuery,
    openSearch,
    closeSearch,
    handleSearchQueryChange,
    handleResultSelect,
  };
};
