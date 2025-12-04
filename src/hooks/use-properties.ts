// [HOOK] useProperties - Hook for property operations
// Gestisce lo stato e le operazioni CRUD per gli immobili

import { useState, useCallback, useEffect } from 'react';
import type { Property, CreatePropertyRequest, UpdatePropertyRequest, PropertyFilters } from '@/lib/types';

interface UsePropertiesOptions {
  autoFetch?: boolean;
  filters?: PropertyFilters;
}

export function useProperties(options: UsePropertiesOptions = { autoFetch: true }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async (filters?: PropertyFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.properties.getAll(filters);
      if (response.success && response.data) {
        setProperties(response.data);
      } else {
        setError(response.error?.message || 'Errore nel caricamento');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBySeller = useCallback(async (sellerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.properties.getBySeller(sellerId);
      if (response.success && response.data) {
        setProperties(response.data);
      } else {
        setError(response.error?.message || 'Errore nel caricamento');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProperty = useCallback(async (data: CreatePropertyRequest): Promise<Property | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.properties.create(data);
      if (response.success && response.data) {
        setProperties((prev) => [response.data!, ...prev]);
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

  const updateProperty = useCallback(async (data: UpdatePropertyRequest): Promise<Property | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.properties.update(data);
      if (response.success && response.data) {
        setProperties((prev) => prev.map((p) => (p.id === data.id ? response.data! : p)));
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

  const deleteProperty = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.properties.delete(id);
      if (response.success) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
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
      fetchProperties(options.filters);
    }
  }, [options.autoFetch, fetchProperties, options.filters]);

  return {
    properties,
    loading,
    error,
    fetchProperties,
    fetchBySeller,
    createProperty,
    updateProperty,
    deleteProperty,
    clearError: () => setError(null),
  };
}
