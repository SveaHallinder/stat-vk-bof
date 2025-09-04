import { useEffect } from 'react';

export const RoutePrefetcher = () => {
  useEffect(() => {
    const prefetch = () => {
      // Viktigast först
      Promise.allSettled([
        import('@/screens/DashboardRedesign'),
        import('@/screens/KunderPage'),
        import('@/screens/RegistreraTidPage'),
      ]).finally(() => {
        // Resten
        Promise.allSettled([
          import('@/screens/ArendelistaPage'),
          import('@/screens/StatistikPage'),
          import('@/screens/AdminPage'),
          import('@/screens/MinProfilPage'),
          import('@/screens/KunderPage/CustomerProfile'),
        ]);
      });
    };
    // Starta snabbt efter mount
    const t = setTimeout(prefetch, 100);
    return () => clearTimeout(t);
  }, []);
  return null;
};
