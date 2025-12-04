// [HOOK] useBuyers - Hook for buyer operations
// Gestisce lo stato e le operazioni CRUD per i compratori

import { useState, useCallback, useEffect } from 'react';
import type { Buyer, CreateBuyerRequest, UpdateBuyerRequest, BuyerFilters } from '@/lib/types';

interface UseBuyersOptions {
  autoFetch?: boolean;
  filters?: BuyerFilters;
}

export function useBuyers(options: UseBuyersOptions = { autoFetch: true }) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuyers = useCallback(async (filters?: BuyerFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.buyers.getAll(filters);
      if (response.success && response.data) {
        setBuyers(response.data);
      } else {
        setError(response.error?.message || 'Errore nel caricamento');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBuyer = useCallback(async (data: CreateBuyerRequest): Promise<Buyer | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.buyers.create(data);
      if (response.success && response.data) {
        setBuyers((prev) => [response.data!, ...prev]);
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

  const updateBuyer = useCallback(async (data: UpdateBuyerRequest): Promise<Buyer | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.buyers.update(data);
      if (response.success && response.data) {
        setBuyers((prev) => prev.map((b) => (b.id === data.id ? response.data! : b)));
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

  const deleteBuyer = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.buyers.delete(id);
      if (response.success) {
        setBuyers((prev) => prev.filter((b) => b.id !== id));
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
      fetchBuyers(options.filters);
    }
  }, [options.autoFetch, fetchBuyers, options.filters]);

  return {
    buyers,
    loading,
    error,
    fetchBuyers,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    clearError: () => setError(null),
  };
}

// Hook per singolo buyer
export function useBuyer(id: string | null) {
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setBuyer(null);
      return;
    }

    const fetchBuyer = async () => {
      setLoading(true);
      try {
        const response = await window.api.buyers.getById(id);
        if (response.success && response.data) {
          setBuyer(response.data);
        } else {
          setError(response.error?.message || 'Buyer non trovato');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    };

    fetchBuyer();
  }, [id]);

  return { buyer, loading, error };
}
