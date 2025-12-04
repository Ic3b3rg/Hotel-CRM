// [PAGE] Trattative - Deals Kanban and table view

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/search-input';
import { TagBadge } from '@/components/tag-badge';
import { DetailPanel } from '@/components/detail-panel';
import { EmptyState } from '@/components/empty-state';
import { DealForm } from '@/components/deal-form';
import { ActivityForm } from '@/components/activity-form';
import { useDeals } from '@/hooks/use-deals';
import { useBuyers } from '@/hooks/use-buyers';
import { useProperties } from '@/hooks/use-properties';
import { useActivities } from '@/hooks/use-activities';
import { formatCurrency, formatDate, getDealStatusLabel, getDealStatusColor, getActivityTypeLabel } from '@/lib/utils-crm';
import type { Deal, DealStatus, CreateDealRequest, UpdateDealRequest, CreateActivityRequest } from '@/lib/types';
import { Handshake, LayoutGrid, Table, Loader2, Plus, Phone, Mail, Calendar, FileText, Clock, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DEAL_STATUSES: DealStatus[] = [
  'nuovo_contatto',
  'in_corso',
  'offerta_inviata',
  'diligenza',
  'chiuso_positivo',
  'chiuso_negativo',
];

const activityIcons: Record<string, typeof Phone> = {
  nota: FileText,
  chiamata: Phone,
  email: Mail,
  appuntamento: Calendar,
  follow_up: Clock,
};

export default function TrattativePage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  const { deals, loading, createDeal, updateDeal, updateStatus, deleteDeal, fetchDeals } = useDeals();
  const { buyers } = useBuyers();
  const { properties } = useProperties();
  const { createActivity } = useActivities();

  const getBuyerName = (buyerId: string) => buyers.find((b) => b.id === buyerId)?.name || 'N/D';
  const getPropertyName = (propertyId: string) =>
    properties.find((p) => p.id === propertyId)?.name || 'N/D';

  const filteredDeals = deals.filter((deal) => {
    const buyer = buyers.find((b) => b.id === deal.buyerId);
    const property = properties.find((p) => p.id === deal.propertyId);
    return (
      buyer?.name.toLowerCase().includes(search.toLowerCase()) ||
      property?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getDealsByStatus = (status: DealStatus) =>
    filteredDeals.filter((d) => d.status === status);

  const handleStatusChange = async (dealId: string, newStatus: DealStatus) => {
    await updateStatus(dealId, newStatus);
  };

  const handleCreateDeal = async (data: CreateDealRequest) => {
    const result = await createDeal(data);
    if (result) {
      setShowNewDealForm(false);
    }
  };

  const handleCreateActivity = useCallback(async (data: CreateActivityRequest) => {
    const result = await createActivity(data);
    if (result) {
      // Ricarica i deals per avere le attivita aggiornate
      await fetchDeals();
      // Aggiorna il deal selezionato
      const updatedDeal = deals.find(d => d.id === data.dealId);
      if (updatedDeal) {
        // Trova il deal aggiornato nella lista refreshata
        setTimeout(() => {
          const refreshedDeals = deals;
          const refreshedDeal = refreshedDeals.find(d => d.id === data.dealId);
          if (refreshedDeal) {
            setSelectedDeal(refreshedDeal);
          }
        }, 100);
      }
      setShowActivityForm(false);
    }
  }, [createActivity, fetchDeals, deals]);

  const handleUpdateDeal = async (data: CreateDealRequest) => {
    if (!editingDeal) return;
    const result = await updateDeal({ ...data, id: editingDeal.id } as UpdateDealRequest);
    if (result) {
      setEditingDeal(null);
      setSelectedDeal(null);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    const result = await deleteDeal(dealToDelete.id);
    if (result) {
      setDealToDelete(null);
      setSelectedDeal(null);
    }
  };

  const handleEditClick = () => {
    if (selectedDeal) {
      setEditingDeal(selectedDeal);
      setSelectedDeal(null);
    }
  };

  const handleDeleteClick = () => {
    if (selectedDeal) {
      setDealToDelete(selectedDeal);
    }
  };

  // Refresh selectedDeal quando deals cambia
  const refreshSelectedDeal = useCallback(() => {
    if (selectedDeal) {
      const updated = deals.find(d => d.id === selectedDeal.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedDeal)) {
        setSelectedDeal(updated);
      }
    }
  }, [deals, selectedDeal]);

  // Aggiorna selectedDeal quando i deals cambiano
  useState(() => {
    refreshSelectedDeal();
  });

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trattative</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestione delle negoziazioni in corso
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowNewDealForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nuova Trattativa
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table className="w-4 h-4 mr-1" />
            Tabella
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <SearchInput
          placeholder="Cerca per compratore o immobile..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {filteredDeals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Nessuna trattativa trovata"
          description="Crea una nuova trattativa per iniziare"
          action={{ label: 'Nuova Trattativa', onClick: () => setShowNewDealForm(true) }}
        />
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEAL_STATUSES.map((status) => (
            <div key={status} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">{getDealStatusLabel(status)}</h3>
                <span className="text-xs text-muted-foreground">
                  {getDealsByStatus(status).length}
                </span>
              </div>
              <div className="space-y-2">
                {getDealsByStatus(status).map((deal) => (
                  <Card
                    key={deal.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDeal(deal)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id)}
                  >
                    <p className="font-medium text-sm mb-1">{getPropertyName(deal.propertyId)}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {getBuyerName(deal.buyerId)}
                    </p>
                    {deal.priceOffered && (
                      <p className="text-xs text-primary">{formatCurrency(deal.priceOffered)}</p>
                    )}
                    {deal.activities.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {deal.activities.length} attivita
                      </p>
                    )}
                  </Card>
                ))}
              </div>
              <div
                className="mt-2 p-4 border-2 border-dashed border-border rounded-md text-center text-xs text-muted-foreground"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const dealId = e.dataTransfer.getData('dealId');
                  if (dealId) handleStatusChange(dealId, status);
                }}
              >
                Trascina qui
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Immobile
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Compratore
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Stato
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Offerta
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Attivita
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                    Ultimo Agg.
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <td className="px-4 py-3 font-medium">{getPropertyName(deal.propertyId)}</td>
                    <td className="px-4 py-3">{getBuyerName(deal.buyerId)}</td>
                    <td className="px-4 py-3">
                      <TagBadge className={getDealStatusColor(deal.status)}>
                        {getDealStatusLabel(deal.status)}
                      </TagBadge>
                    </td>
                    <td className="px-4 py-3">
                      {deal.priceOffered ? formatCurrency(deal.priceOffered) : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {deal.activities.length}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(deal.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Panel per trattativa selezionata */}
      <DetailPanel
        title="Dettaglio Trattativa"
        open={selectedDeal !== null}
        onClose={() => {
          setSelectedDeal(null);
          setShowActivityForm(false);
        }}
        width="lg"
      >
        {selectedDeal && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{getPropertyName(selectedDeal.propertyId)}</h3>
                <p className="text-muted-foreground">{getBuyerName(selectedDeal.buyerId)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleEditClick}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Modifica
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteClick} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Elimina
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <TagBadge className={getDealStatusColor(selectedDeal.status)}>
                {getDealStatusLabel(selectedDeal.status)}
              </TagBadge>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedDeal.priceOffered && (
                <div>
                  <span className="text-muted-foreground">Offerta:</span>{' '}
                  <span className="font-medium">{formatCurrency(selectedDeal.priceOffered)}</span>
                </div>
              )}
              {selectedDeal.priceNegotiated && (
                <div>
                  <span className="text-muted-foreground">Negoziato:</span>{' '}
                  <span className="font-medium">{formatCurrency(selectedDeal.priceNegotiated)}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Creata:</span>{' '}
                {formatDate(selectedDeal.createdAt)}
              </div>
              <div>
                <span className="text-muted-foreground">Aggiornata:</span>{' '}
                {formatDate(selectedDeal.updatedAt)}
              </div>
            </div>

            {/* Sezione Attivita */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Storico Attivita</h4>
                {!showActivityForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowActivityForm(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Aggiungi
                  </Button>
                )}
              </div>

              {/* Form nuova attivita */}
              {showActivityForm && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <ActivityForm
                    dealId={selectedDeal.id}
                    onSubmit={handleCreateActivity}
                    onCancel={() => setShowActivityForm(false)}
                    compact
                  />
                </div>
              )}

              {/* Lista attivita */}
              {selectedDeal.activities.length > 0 ? (
                <div className="space-y-3">
                  {selectedDeal.activities.map((activity) => {
                    const Icon = activityIcons[activity.type] || FileText;
                    return (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {getActivityTypeLabel(activity.type)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.date)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna attivita registrata
                </p>
              )}
            </div>

            {/* Note */}
            {selectedDeal.notes && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Note</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedDeal.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </DetailPanel>

      {/* Detail Panel per nuova trattativa */}
      <DetailPanel
        title="Nuova Trattativa"
        open={showNewDealForm}
        onClose={() => setShowNewDealForm(false)}
      >
        <DealForm
          onClose={() => setShowNewDealForm(false)}
          onSubmit={handleCreateDeal}
        />
      </DetailPanel>

      {/* Edit Deal Form */}
      <DetailPanel
        title="Modifica Trattativa"
        open={editingDeal !== null}
        onClose={() => setEditingDeal(null)}
      >
        {editingDeal && (
          <DealForm
            onClose={() => setEditingDeal(null)}
            onSubmit={handleUpdateDeal}
            initialData={editingDeal}
          />
        )}
      </DetailPanel>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={dealToDelete !== null} onOpenChange={() => setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa trattativa?
              Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
