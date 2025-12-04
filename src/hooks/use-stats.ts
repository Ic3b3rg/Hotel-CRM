// [HOOK] useStats - Hook for dashboard statistics
// Gestisce le statistiche per la dashboard

import { useState, useCallback, useEffect } from 'react';
import type { DashboardStats, Deal } from '@/lib/types';

export function useStats(autoFetch: boolean = true) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.stats.getDashboard();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error?.message || 'Errore nel caricamento');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch, fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    clearError: () => setError(null),
  };
}

export function useStaleDeals(days: number = 30, autoFetch: boolean = true) {
  const [staleDeals, setStaleDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaleDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.stats.getStaleDeals(days);
      if (response.success && response.data) {
        setStaleDeals(response.data);
      } else {
        setError(response.error?.message || 'Errore nel caricamento');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (autoFetch) {
      fetchStaleDeals();
    }
  }, [autoFetch, fetchStaleDeals]);

  return {
    staleDeals,
    loading,
    error,
    fetchStaleDeals,
    clearError: () => setError(null),
  };
}
