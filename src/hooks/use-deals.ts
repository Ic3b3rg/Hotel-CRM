// [HOOK] useDeals - Hook for deal operations
// Gestisce lo stato e le operazioni CRUD per le trattative

import { useState, useCallback, useEffect } from 'react';
import type { Deal, CreateDealRequest, UpdateDealRequest, DealStatus } from '@/lib/types';

interface UseDealsOptions {
  autoFetch?: boolean;
}

export function useDeals(options: UseDealsOptions = { autoFetch: true }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.deals.getAll();
      if (response.success && response.data) {
        setDeals(response.data);
      } else {
        setError(response.error?.message || 'Errore nel caricamento');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByBuyer = useCallback(async (buyerId: string): Promise<Deal[]> => {
    try {
      const response = await window.api.deals.getByBuyer(buyerId);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const fetchByProperty = useCallback(async (propertyId: string): Promise<Deal[]> => {
    try {
      const response = await window.api.deals.getByProperty(propertyId);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const createDeal = useCallback(async (data: CreateDealRequest): Promise<Deal | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.deals.create(data);
      if (response.success && response.data) {
        setDeals((prev) => [response.data!, ...prev]);
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

  const updateDeal = useCallback(async (data: UpdateDealRequest): Promise<Deal | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.deals.update(data);
      if (response.success && response.data) {
        setDeals((prev) => prev.map((d) => (d.id === data.id ? response.data! : d)));
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

  const updateStatus = useCallback(async (id: string, status: DealStatus): Promise<Deal | null> => {
    try {
      const response = await window.api.deals.updateStatus(id, status);
      if (response.success && response.data) {
        setDeals((prev) => prev.map((d) => (d.id === id ? response.data! : d)));
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const deleteDeal = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.deals.delete(id);
      if (response.success) {
        setDeals((prev) => prev.filter((d) => d.id !== id));
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
      fetchDeals();
    }
  }, [options.autoFetch, fetchDeals]);

  return {
    deals,
    loading,
    error,
    fetchDeals,
    fetchByBuyer,
    fetchByProperty,
    createDeal,
    updateDeal,
    updateStatus,
    deleteDeal,
    clearError: () => setError(null),
  };
}
