// [HOOK] usePropertyAttachments - Hook for property attachment operations
// Gestisce lo stato e le operazioni per gli allegati degli immobili

import { useState, useCallback, useEffect } from 'react';
import type { PropertyAttachment } from '@/lib/types';

interface UsePropertyAttachmentsOptions {
  propertyId?: string;
  autoFetch?: boolean;
}

export function usePropertyAttachments(options: UsePropertyAttachmentsOptions = {}) {
  const [attachments, setAttachments] = useState<PropertyAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByProperty = useCallback(async (propertyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.propertyAttachments.getByProperty(propertyId);
      if (response.success && response.data) {
        setAttachments(response.data);
        return response.data;
      } else {
        setError(response.error?.message || 'Errore nel caricamento allegati');
        return [];
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carica un file allegato per un immobile
   * @param propertyId - ID dell'immobile
   * @param file - File da caricare
   */
  const uploadFile = useCallback(async (propertyId: string, file: File): Promise<PropertyAttachment | null> => {
    setLoading(true);
    setError(null);
    try {
      // Leggi il file come base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Rimuovi il prefisso data:...;base64,
          const base64 = result.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await window.api.propertyAttachments.saveFile({
        propertyId,
        originalFilename: file.name,
        fileData,
      });

      if (response.success && response.data) {
        setAttachments((prev) => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.error?.message || 'Errore nel caricamento file');
        return null;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Elimina un allegato
   * @param id - ID dell'allegato da eliminare
   */
  const deleteAttachment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.propertyAttachments.delete(id);
      if (response.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
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

  /**
   * Apre un allegato con l'applicazione predefinita
   * @param id - ID dell'allegato da aprire
   */
  const openAttachment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.propertyAttachments.open(id);
      if (response.success) {
        return true;
      } else {
        setError(response.error?.message || "Errore nell'apertura file");
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
    if (options.autoFetch && options.propertyId) {
      fetchByProperty(options.propertyId);
    }
  }, [options.autoFetch, options.propertyId, fetchByProperty]);

  return {
    attachments,
    loading,
    error,
    fetchByProperty,
    uploadFile,
    deleteAttachment,
    openAttachment,
    clearError: () => setError(null),
  };
}
