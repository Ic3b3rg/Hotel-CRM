// [PAGE] Immobili - Properties list and management

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { TagBadge } from '@/components/tag-badge';
import { DetailPanel } from '@/components/detail-panel';
import { EmptyState } from '@/components/empty-state';
import { PropertyForm } from '@/components/property-form';
import { useProperties } from '@/hooks/use-properties';
import { useSellers } from '@/hooks/use-sellers';
import { formatCurrency, getPropertyTypeLabel, getConditionLabel } from '@/lib/utils-crm';
import type { Property, CreatePropertyRequest, UpdatePropertyRequest } from '@/lib/types';
import { Building2, MapPin, BedDouble, Filter, ChevronDown, Loader2, Pencil, Trash2 } from 'lucide-react';
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

export default function ImmobiliPage() {
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const { properties, loading, createProperty, updateProperty, deleteProperty } = useProperties();
  const { sellers } = useSellers();

  const handleCreateProperty = async (data: CreatePropertyRequest) => {
    const result = await createProperty(data);
    if (result) {
      setShowForm(false);
    }
  };

  const handleUpdateProperty = async (data: CreatePropertyRequest) => {
    if (!editingProperty) return;
    const result = await updateProperty({ ...data, id: editingProperty.id } as UpdatePropertyRequest);
    if (result) {
      setEditingProperty(null);
      setSelectedProperty(null);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    const result = await deleteProperty(propertyToDelete.id);
    if (result) {
      setPropertyToDelete(null);
      setSelectedProperty(null);
    }
  };

  const handleEditClick = () => {
    if (selectedProperty) {
      setEditingProperty(selectedProperty);
      setSelectedProperty(null);
    }
  };

  const handleDeleteClick = () => {
    if (selectedProperty) {
      setPropertyToDelete(selectedProperty);
    }
  };

  const allCities = useMemo(
    () => [...new Set(properties.map((p) => p.address.city).filter(Boolean))].sort(),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        property.name.toLowerCase().includes(search.toLowerCase()) ||
        property.address.city.toLowerCase().includes(search.toLowerCase());
      const matchesCity = !filterCity || property.address.city === filterCity;
      const matchesType = !filterType || property.type === filterType;
      return matchesSearch && matchesCity && matchesType;
    });
  }, [properties, search, filterCity, filterType]);

  const getSellerName = (sellerId: string) =>
    sellers.find((s) => s.id === sellerId)?.name || 'N/D';

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Immobili"
        description="Gestione delle strutture in vendita"
        action={{ label: 'Nuovo Immobile', onClick: () => setShowForm(true) }}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput placeholder="Cerca per nome, città..." value={search} onChange={setSearch} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1.5" />
              Città {filterCity && `(${filterCity})`}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterCity(null)}>Tutte le città</DropdownMenuItem>
            {allCities.map((city) => (
              <DropdownMenuItem key={city} onClick={() => setFilterCity(city)}>
                {city}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1.5" />
              Tipo {filterType && `(${getPropertyTypeLabel(filterType as Property['type'])})`}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType(null)}>Tutti i tipi</DropdownMenuItem>
            {['hotel', 'b&b', 'affittacamere', 'residence', 'altro'].map((type) => (
              <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                {getPropertyTypeLabel(type as Property['type'])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(filterCity || filterType) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterCity(null); setFilterType(null); }}>
            Rimuovi filtri
          </Button>
        )}
      </div>

      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nessun immobile trovato"
          description="Modifica i filtri o aggiungi un nuovo immobile"
          action={{ label: 'Nuovo Immobile', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property) => (
            <Card
              key={property.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedProperty(property)}
            >
              <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold mb-1">{property.name}</h3>
              {(property.address.city || property.address.province) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {[property.address.city, property.address.province].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm mb-2">
                <TagBadge>{getPropertyTypeLabel(property.type)}</TagBadge>
                {property.category !== 'n/a' && <TagBadge variant="primary">{property.category}</TagBadge>}
              </div>
              <div className="flex items-center justify-between text-sm">
                {property.rooms > 0 && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    {property.rooms} camere
                  </span>
                )}
                {property.priceMin > 0 && (
                  <span className="font-medium text-primary">
                    {formatCurrency(property.priceMin)}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <DetailPanel
        title="Dettaglio Immobile"
        open={selectedProperty !== null}
        onClose={() => setSelectedProperty(null)}
        width="xl"
      >
        {selectedProperty && (
          <div className="space-y-4">
            {/* Header with Actions */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedProperty.name}</h3>
                {selectedProperty.address.city && (
                  <p className="text-muted-foreground">
                    {selectedProperty.address.street} {selectedProperty.address.number}
                    {selectedProperty.address.street && ', '}
                    {selectedProperty.address.city}
                    {selectedProperty.address.province && ` (${selectedProperty.address.province})`}
                  </p>
                )}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>{' '}
                {getPropertyTypeLabel(selectedProperty.type)}
              </div>
              <div>
                <span className="text-muted-foreground">Categoria:</span> {selectedProperty.category}
              </div>
              {selectedProperty.rooms > 0 && (
                <div>
                  <span className="text-muted-foreground">Camere:</span> {selectedProperty.rooms}
                </div>
              )}
              {selectedProperty.beds > 0 && (
                <div>
                  <span className="text-muted-foreground">Posti letto:</span> {selectedProperty.beds}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Condizione:</span>{' '}
                {getConditionLabel(selectedProperty.condition)}
              </div>
              {selectedProperty.sellerId && (
                <div>
                  <span className="text-muted-foreground">Venditore:</span>{' '}
                  {getSellerName(selectedProperty.sellerId)}
                </div>
              )}
            </div>
            {(selectedProperty.priceMin > 0 || selectedProperty.priceMax > 0) && (
              <div className="pt-4 border-t">
                <p className="text-lg font-semibold text-primary">
                  {selectedProperty.priceMin > 0 && selectedProperty.priceMax > 0
                    ? `${formatCurrency(selectedProperty.priceMin)} - ${formatCurrency(selectedProperty.priceMax)}`
                    : selectedProperty.priceMin > 0
                      ? `Da ${formatCurrency(selectedProperty.priceMin)}`
                      : `Fino a ${formatCurrency(selectedProperty.priceMax)}`}
                </p>
              </div>
            )}
            {selectedProperty.notes && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Note</h4>
                <p className="text-sm">{selectedProperty.notes}</p>
              </div>
            )}
          </div>
        )}
      </DetailPanel>

      <DetailPanel
        title="Nuovo Immobile"
        open={showForm}
        onClose={() => setShowForm(false)}
        width="xl"
      >
        <PropertyForm onClose={() => setShowForm(false)} onSubmit={handleCreateProperty} sellers={sellers} />
      </DetailPanel>

      {/* Edit Property Form */}
      <DetailPanel
        title="Modifica Immobile"
        open={editingProperty !== null}
        onClose={() => setEditingProperty(null)}
        width="xl"
      >
        {editingProperty && (
          <PropertyForm
            onClose={() => setEditingProperty(null)}
            onSubmit={handleUpdateProperty}
            sellers={sellers}
            initialData={editingProperty}
          />
        )}
      </DetailPanel>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={propertyToDelete !== null} onOpenChange={() => setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'immobile "{propertyToDelete?.name}"?
              Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
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
