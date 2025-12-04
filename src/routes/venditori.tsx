// [PAGE] Venditori - Sellers list and management

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { DetailPanel } from '@/components/detail-panel';
import { EmptyState } from '@/components/empty-state';
import { useSellers } from '@/hooks/use-sellers';
import { useProperties } from '@/hooks/use-properties';
import { formatDate } from '@/lib/utils-crm';
import type { Seller, CreateSellerRequest, UpdateSellerRequest } from '@/lib/types';
import { UserCheck, Phone, Mail, Building2, Loader2 } from 'lucide-react';
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
import { SellerForm } from '@/components/seller-form';
import { SellerDetail } from '@/components/seller-detail';

export default function VenditoriPage() {
  const [search, setSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null);

  const { sellers, loading, createSeller, updateSeller, deleteSeller } = useSellers();
  const { properties } = useProperties();

  const filteredSellers = useMemo(() => {
    return sellers.filter(
      (seller) =>
        seller.name.toLowerCase().includes(search.toLowerCase()) ||
        seller.company?.toLowerCase().includes(search.toLowerCase()) ||
        seller.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [sellers, search]);

  const getSellerProperties = (sellerId: string) =>
    properties.filter((p) => p.sellerId === sellerId);

  const handleCreateSeller = async (data: CreateSellerRequest) => {
    const result = await createSeller(data);
    if (result) setShowForm(false);
  };

  const handleUpdateSeller = async (data: CreateSellerRequest) => {
    if (!editingSeller) return;
    const result = await updateSeller({ ...data, id: editingSeller.id } as UpdateSellerRequest);
    if (result) {
      setEditingSeller(null);
      setSelectedSeller(null);
    }
  };

  const handleDeleteSeller = async () => {
    if (!sellerToDelete) return;
    const result = await deleteSeller(sellerToDelete.id);
    if (result) {
      setSellerToDelete(null);
      setSelectedSeller(null);
    }
  };

  const handleEditClick = () => {
    if (selectedSeller) {
      setEditingSeller(selectedSeller);
      setSelectedSeller(null);
    }
  };

  const handleDeleteClick = () => {
    if (selectedSeller) {
      setSellerToDelete(selectedSeller);
    }
  };

  if (loading && sellers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Venditori"
        description="Gestione dei proprietari di immobili"
        action={{ label: 'Nuovo Venditore', onClick: () => setShowForm(true) }}
      />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          placeholder="Cerca per nome, azienda, email..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {filteredSellers.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nessun venditore trovato"
          description="Modifica la ricerca o aggiungi un nuovo venditore"
          action={{ label: 'Nuovo Venditore', onClick: () => setShowForm(true) }}
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
                    Immobili
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                    Ultimo Contatto
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map((seller) => {
                  const sellerProperties = getSellerProperties(seller.id);
                  return (
                    <tr
                      key={seller.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedSeller(seller)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{seller.name}</p>
                        {seller.company && (
                          <p className="text-sm text-muted-foreground">{seller.company}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            {seller.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {seller.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {sellerProperties.length} immobili
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {seller.lastContact ? formatDate(seller.lastContact) : '—'}
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

      <DetailPanel
        title="Dettaglio Venditore"
        open={selectedSeller !== null}
        onClose={() => setSelectedSeller(null)}
      >
        {selectedSeller && (
          <SellerDetail
            seller={selectedSeller}
            properties={getSellerProperties(selectedSeller.id)}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </DetailPanel>

      <DetailPanel title="Nuovo Venditore" open={showForm} onClose={() => setShowForm(false)}>
        <SellerForm onClose={() => setShowForm(false)} onSubmit={handleCreateSeller} />
      </DetailPanel>

      {/* Edit Seller Form */}
      <DetailPanel
        title="Modifica Venditore"
        open={editingSeller !== null}
        onClose={() => setEditingSeller(null)}
      >
        {editingSeller && (
          <SellerForm
            onClose={() => setEditingSeller(null)}
            onSubmit={handleUpdateSeller}
            initialData={editingSeller}
          />
        )}
      </DetailPanel>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={sellerToDelete !== null} onOpenChange={() => setSellerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il venditore "{sellerToDelete?.name}"?
              Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeller}
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
