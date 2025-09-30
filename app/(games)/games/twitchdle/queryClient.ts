'use client';

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 min: cache "fresco"
      gcTime: 24 * 60 * 60 * 1000, // retener 1 día en cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: false,      // no refetch si ya hay datos en cache
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Persistencia manual en localStorage
if (typeof window !== 'undefined') {
  const CACHE_KEY = 'twitchdle-cache-v1';
  const MAX_AGE = 24 * 60 * 60 * 1000; // 1 día

  // Cargar cache al inicializar
  const loadCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < MAX_AGE) {
          queryClient.setQueryData(['cache'], data);
        }
      }
    } catch (error) {
      console.warn('Error loading cache:', error);
    }
  };

  // Guardar cache cuando cambie
  const saveCache = () => {
    try {
      const data = queryClient.getQueryData(['cache']);
      if (data) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.warn('Error saving cache:', error);
    }
  };

  // Cargar cache inicial
  loadCache();

  // Guardar cache cada 30 segundos
  setInterval(saveCache, 30000);

  // Guardar cache antes de cerrar la página
  window.addEventListener('beforeunload', saveCache);
}
