// [HOOK] useSellers - Hook for seller operations
// Gestisce lo stato e le operazioni CRUD per i venditori

import { useState, useCallback, useEffect } from 'react';
import type { Seller, CreateSellerRequest, UpdateSellerRequest, SellerFilters } from '@/lib/types';

interface UseSellersOptions {
  autoFetch?: boolean;
  filters?: SellerFilters;
}

export function useSellers(options: UseSellersOptions = { autoFetch: true }) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSellers = useCallback(async (filters?: SellerFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.sellers.getAll(filters);
      if (response.success && response.data) {
        setSellers(response.data);
      } else {
        setError(response.error?.message || 'Errore nel caricamento');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSeller = useCallback(async (data: CreateSellerRequest): Promise<Seller | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.sellers.create(data);
      if (response.success && response.data) {
        setSellers((prev) => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.error?.message || 'Errore nella creazione');
        return null;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSeller = useCallback(async (data: UpdateSellerRequest): Promise<Seller | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.sellers.update(data);
      if (response.success && response.data) {
        setSellers((prev) => prev.map((s) => (s.id === data.id ? response.data! : s)));
        return response.data;
      } else {
        setError(response.error?.message || "Errore nell'aggiornamento");
        return null;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSeller = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.sellers.delete(id);
      if (response.success) {
        setSellers((prev) => prev.filter((s) => s.id !== id));
        return true;
      } else {
        setError(response.error?.message || "Errore nell'eliminazione");
        return false;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.autoFetch) {
      fetchSellers(options.filters);
    }
  }, [options.autoFetch, fetchSellers, options.filters]);

  return {
    sellers,
    loading,
    error,
    fetchSellers,
    createSeller,
    updateSeller,
    deleteSeller,
    clearError: () => setError(null),
  };
}
