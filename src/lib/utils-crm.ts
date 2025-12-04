// [UTILS-CRM] CRM-specific utility functions
// Funzioni di formattazione e label per il dominio CRM

import type { DealStatus, PropertyType, PropertyCondition, ActivityType } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function getDealStatusLabel(status: DealStatus): string {
  const labels: Record<DealStatus, string> = {
    nuovo_contatto: 'Nuovo Contatto',
    in_corso: 'In Corso',
    offerta_inviata: 'Offerta Inviata',
    diligenza: 'Due Diligence',
    chiuso_positivo: 'Chiuso +',
    chiuso_negativo: 'Chiuso -',
  };
  return labels[status];
}

export function getDealStatusColor(status: DealStatus): string {
  const colors: Record<DealStatus, string> = {
    nuovo_contatto: 'bg-sky-100 text-sky-700',
    in_corso: 'bg-amber-100 text-amber-700',
    offerta_inviata: 'bg-indigo-100 text-indigo-700',
    diligenza: 'bg-blue-100 text-blue-800',
    chiuso_positivo: 'bg-blue-100 text-blue-800',
    chiuso_negativo: 'bg-red-100 text-red-700',
  };
  return colors[status];
}

export function getPropertyTypeLabel(type: PropertyType): string {
  const labels: Record<PropertyType, string> = {
    hotel: 'Hotel',
    'b&b': 'B&B',
    affittacamere: 'Affittacamere',
    residence: 'Residence',
    altro: 'Altro',
  };
  return labels[type];
}

export function getConditionLabel(condition: PropertyCondition): string {
  const labels: Record<PropertyCondition, string> = {
    ottimo: 'Ottimo',
    buono: 'Buono',
    da_ristrutturare: 'Da Ristrutturare',
    in_costruzione: 'In Costruzione',
  };
  return labels[condition];
}

export function getLevelLabel(level: string | undefined): string {
  if (!level) return '';
  const labels: Record<string, string> = {
    privato: 'Investitore Privato',
    fondo: 'Fondo',
    gruppo_alberghiero: 'Gruppo Alberghiero',
    investitore: 'Investitore',
  };
  return labels[level] || level;
}

export function getActivityTypeLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    nota: 'Nota',
    chiamata: 'Chiamata',
    email: 'Email',
    appuntamento: 'Appuntamento',
    follow_up: 'Follow-up',
  };
  return labels[type];
}
