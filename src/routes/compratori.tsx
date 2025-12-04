// [PAGE] Compratori - Buyers list and management
// Lista compratori con filtri, dettagli e form

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { TagBadge } from '@/components/tag-badge';
import { DetailPanel } from '@/components/detail-panel';
import { EmptyState } from '@/components/empty-state';
import { useBuyers } from '@/hooks/use-buyers';
import { useDeals } from '@/hooks/use-deals';
import { formatCurrency, formatDate, getLevelLabel } from '@/lib/utils-crm';
import type { Buyer, CreateBuyerRequest, UpdateBuyerRequest } from '@/lib/types';
import { Users, Phone, Mail, Filter, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { BuyerForm } from '@/components/buyer-form';
import { BuyerDetail } from '@/components/buyer-detail';

export default function CompratoriPage() {
  const [search, setSearch] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [buyerToDelete, setBuyerToDelete] = useState<Buyer | null>(null);
  const [filterZone, setFilterZone] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  const { buyers, loading, error, createBuyer, updateBuyer, deleteBuyer } = useBuyers();
  const { deals } = useDeals();

  // Zone e livelli unici per i filtri
  const allZones = useMemo(
    () => [...new Set(buyers.flatMap((b) => b.zones))].sort(),
    [buyers]
  );
  const allLevels = useMemo(
    () => [...new Set(buyers.map((b) => b.level).filter(Boolean))] as string[],
    [buyers]
  );

  // Filtraggio
  const filteredBuyers = useMemo(() => {
    return buyers.filter((buyer) => {
      const matchesSearch =
        buyer.name.toLowerCase().includes(search.toLowerCase()) ||
        buyer.company?.toLowerCase().includes(search.toLowerCase()) ||
        buyer.email.toLowerCase().includes(search.toLowerCase());

      const matchesZone = !filterZone || buyer.zones.includes(filterZone);
      const matchesLevel = !filterLevel || buyer.level === filterLevel;

      return matchesSearch && matchesZone && matchesLevel;
    });
  }, [buyers, search, filterZone, filterLevel]);

  const getBuyerDeals = (buyerId: string) => deals.filter((d) => d.buyerId === buyerId);

  const handleCreateBuyer = async (data: CreateBuyerRequest) => {
    const result = await createBuyer(data);
    if (result) {
      setShowForm(false);
    }
  };

  const handleUpdateBuyer = async (data: CreateBuyerRequest) => {
    if (!editingBuyer) return;
    const result = await updateBuyer({ ...data, id: editingBuyer.id } as UpdateBuyerRequest);
    if (result) {
      setEditingBuyer(null);
      setSelectedBuyer(null);
    }
  };

  const handleDeleteBuyer = async () => {
    if (!buyerToDelete) return;
    const result = await deleteBuyer(buyerToDelete.id);
    if (result) {
      setBuyerToDelete(null);
      setSelectedBuyer(null);
    }
  };

  const handleEditClick = () => {
    if (selectedBuyer) {
      setEditingBuyer(selectedBuyer);
      setSelectedBuyer(null);
    }
  };

  const handleDeleteClick = () => {
    if (selectedBuyer) {
      setBuyerToDelete(selectedBuyer);
    }
  };

  if (loading && buyers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">Errore: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Compratori"
        description="Gestione dei potenziali acquirenti"
        action={{
          label: 'Nuovo Compratore',
          onClick: () => setShowForm(true),
        }}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput
          placeholder="Cerca per nome, azienda, email..."
          value={search}
          onChange={setSearch}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1.5" />
              Zona {filterZone && `(${filterZone})`}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterZone(null)}>Tutte le zone</DropdownMenuItem>
            {allZones.map((zone) => (
              <DropdownMenuItem key={zone} onClick={() => setFilterZone(zone)}>
                {zone}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1.5" />
              Livello {filterLevel && `(${getLevelLabel(filterLevel)})`}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterLevel(null)}>
              Tutti i livelli
            </DropdownMenuItem>
            {allLevels.map((level) => (
              <DropdownMenuItem key={level} onClick={() => setFilterLevel(level)}>
                {getLevelLabel(level)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(filterZone || filterLevel) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterZone(null);
              setFilterLevel(null);
            }}
          >
            Rimuovi filtri
          </Button>
        )}
      </div>

      {/* Buyers Table */}
      {filteredBuyers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun compratore trovato"
          description="Modifica i filtri di ricerca o aggiungi un nuovo compratore"
          action={{
            label: 'Nuovo Compratore',
            onClick: () => setShowForm(true),
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                    Nome / Azienda
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                    Contatti
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                    Budget
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                    Zone
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                    Trattative
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                    Ultimo Contatto
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBuyers.map((buyer) => {
                  const buyerDeals = getBuyerDeals(buyer.id);
                  const activeDeals = buyerDeals.filter(
                    (d) => !['chiuso_positivo', 'chiuso_negativo'].includes(d.status)
                  );

                  return (
                    <tr
                      key={buyer.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedBuyer(buyer)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{buyer.name}</p>
                          {buyer.company && (
                            <p className="text-sm text-muted-foreground">{buyer.company}</p>
                          )}
                          {buyer.level && (
                            <TagBadge variant="primary" size="sm">
                              {getLevelLabel(buyer.level)}
                            </TagBadge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            {buyer.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {buyer.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(buyer.budgetMin)} - {formatCurrency(buyer.budgetMax)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {buyer.zones.slice(0, 2).map((zone) => (
                            <TagBadge key={zone}>{zone}</TagBadge>
                          ))}
                          {buyer.zones.length > 2 && (
                            <TagBadge>+{buyer.zones.length - 2}</TagBadge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">
                          {activeDeals.length} attive / {buyerDeals.length} totali
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {buyer.lastContact ? formatDate(buyer.lastContact) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Panel */}
      <DetailPanel
        title="Dettaglio Compratore"
        open={selectedBuyer !== null}
        onClose={() => setSelectedBuyer(null)}
      >
        {selectedBuyer && (
          <BuyerDetail
            buyer={selectedBuyer}
            deals={getBuyerDeals(selectedBuyer.id)}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </DetailPanel>

      {/* New Buyer Form */}
      <DetailPanel title="Nuovo Compratore" open={showForm} onClose={() => setShowForm(false)}>
        <BuyerForm onClose={() => setShowForm(false)} onSubmit={handleCreateBuyer} />
      </DetailPanel>

      {/* Edit Buyer Form */}
      <DetailPanel
        title="Modifica Compratore"
        open={editingBuyer !== null}
        onClose={() => setEditingBuyer(null)}
      >
        {editingBuyer && (
          <BuyerForm
            onClose={() => setEditingBuyer(null)}
            onSubmit={handleUpdateBuyer}
            initialData={editingBuyer}
          />
        )}
      </DetailPanel>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={buyerToDelete !== null} onOpenChange={() => setBuyerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il compratore "{buyerToDelete?.name}"?
              Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBuyer}
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
