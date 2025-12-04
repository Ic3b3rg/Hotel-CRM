// [HOOK] useActivities - Hook for activity operations
// Gestisce lo stato e le operazioni CRUD per le attività

import { useState, useCallback, useEffect } from 'react';
import type { Activity, CreateActivityRequest } from '@/lib/types';

interface UseActivitiesOptions {
  dealId?: string;
  autoFetch?: boolean;
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByDeal = useCallback(async (dealId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!window.api?.activities) {
        throw new Error('API non disponibile. Riavvia l\'applicazione.');
      }
      const response = await window.api.activities.getByDeal(dealId);
      if (response.success && response.data) {
        setActivities(response.data);
        return response.data;
      } else {
        setError(response.error?.message || 'Errore nel caricamento attivita');
        return [];
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createActivity = useCallback(async (data: CreateActivityRequest): Promise<Activity | null> => {
    setLoading(true);
    setError(null);
    try {
      if (!window.api?.activities) {
        throw new Error('API non disponibile. Riavvia l\'applicazione.');
      }
      const response = await window.api.activities.create(data);
      if (response.success && response.data) {
        setActivities((prev) => [response.data!, ...prev]);
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

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!window.api?.activities) {
        throw new Error('API non disponibile. Riavvia l\'applicazione.');
      }
      const response = await window.api.activities.delete(id);
      if (response.success) {
        setActivities((prev) => prev.filter((a) => a.id !== id));
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
    if (options.autoFetch && options.dealId) {
      fetchByDeal(options.dealId);
    }
  }, [options.autoFetch, options.dealId, fetchByDeal]);

  return {
    activities,
    loading,
    error,
    fetchByDeal,
    createActivity,
    deleteActivity,
    clearError: () => setError(null),
  };
}
