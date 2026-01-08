// [PAGE] Immobili - Properties list and management

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { TagBadge } from '@/components/tag-badge';
import { DetailPanel } from '@/components/detail-panel';
import { EmptyState } from '@/components/empty-state';
import { PropertyForm } from '@/components/property-form';
import { useProperties } from '@/hooks/use-properties';
import { useSellers } from '@/hooks/use-sellers';
import { usePropertyAttachments } from '@/hooks/use-property-attachments';
import { formatCurrency, getPropertyTypeLabel, getConditionLabel, getOperationTypeLabel } from '@/lib/utils-crm';
import type { Property, CreatePropertyRequest, UpdatePropertyRequest, PropertyOperationType } from '@/lib/types';
import { Building2, MapPin, BedDouble, Filter, ChevronDown, Loader2, Pencil, Trash2, FileCheck, X, Paperclip, FileSpreadsheet, FileText, Upload } from 'lucide-react';
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

// Lista delle 20 regioni italiane
const REGIONI_ITALIANE = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige',
  'Umbria',
  "Valle d'Aosta",
  'Veneto',
];

// Lista dei tipi di operazione disponibili
const OPERATION_TYPES: PropertyOperationType[] = [
  'affitto_attivita',
  'vendita_attivita',
  'affitto_mura',
  'vendita_mura',
  'vendita_cespite',
  'vendita_societa',
];

export default function ImmobiliPage() {
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterRegione, setFilterRegione] = useState<string | null>(null);
  const [filterOperationTypes, setFilterOperationTypes] = useState<PropertyOperationType[]>([]);

  const { properties, loading, createProperty, updateProperty, deleteProperty } = useProperties();
  const { sellers } = useSellers();
  const {
    attachments,
    loading: attachmentsLoading,
    fetchByProperty,
    uploadFile,
    deleteAttachment,
    openAttachment,
  } = usePropertyAttachments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch attachments when a property is selected
  useEffect(() => {
    if (selectedProperty) {
      fetchByProperty(selectedProperty.id);
    }
  }, [selectedProperty, fetchByProperty]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProperty || !e.target.files) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      await uploadFile(selectedProperty.id, file);
    }
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAttachmentIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    }
    return <Paperclip className="w-4 h-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allCities = useMemo(
    () => [...new Set(properties.map((p) => p.address.city).filter(Boolean))].sort(),
    [properties]
  );

  // Unique tags used across all properties
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    properties.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, [properties]);

  // Unique regioni used across all properties (filtered from REGIONI_ITALIANE)
  const usedRegioni = useMemo(() => {
    const regioni = new Set<string>();
    properties.forEach((p) => {
      if (p.regione) regioni.add(p.regione);
    });
    return REGIONI_ITALIANE.filter((r) => regioni.has(r));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        property.name.toLowerCase().includes(searchLower) ||
        property.address.city.toLowerCase().includes(searchLower) ||
        (property.codice && property.codice.toLowerCase().includes(searchLower));
      const matchesCity = !filterCity || property.address.city === filterCity;
      const matchesType = !filterType || property.type === filterType;

      // Tag filter: property must have ALL selected tags
      const matchesTags = filterTags.length === 0 ||
        filterTags.every((tag) => property.tags?.includes(tag));

      // Regione filter
      const matchesRegione = !filterRegione || property.regione === filterRegione;

      // Operation type filter: property must have at least one of the selected operation types
      const matchesOperationTypes = filterOperationTypes.length === 0 ||
        filterOperationTypes.some((opType) => property.operationTypes?.includes(opType));

      return matchesSearch && matchesCity && matchesType && matchesTags && matchesRegione && matchesOperationTypes;
    });
  }, [properties, search, filterCity, filterType, filterTags, filterRegione, filterOperationTypes]);

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

        {/* Tag multi-select filter */}
        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1.5" />
                Tag {filterTags.length > 0 && `(${filterTags.length})`}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterTags([])}>Tutti i tag</DropdownMenuItem>
              {allTags.map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={(e) => {
                    e.preventDefault();
                    setFilterTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    );
                  }}
                >
                  <span className={filterTags.includes(tag) ? 'font-semibold' : ''}>
                    {filterTags.includes(tag) ? '✓ ' : ''}{tag}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Regione filter */}
        {usedRegioni.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1.5" />
                Regione {filterRegione && `(${filterRegione})`}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterRegione(null)}>Tutte le regioni</DropdownMenuItem>
              {usedRegioni.map((regione) => (
                <DropdownMenuItem key={regione} onClick={() => setFilterRegione(regione)}>
                  {regione}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Tipo Operazione multi-select filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1.5" />
              Operazione {filterOperationTypes.length > 0 && `(${filterOperationTypes.length})`}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterOperationTypes([])}>Tutte le operazioni</DropdownMenuItem>
            {OPERATION_TYPES.map((opType) => (
              <DropdownMenuItem
                key={opType}
                onClick={(e) => {
                  e.preventDefault();
                  setFilterOperationTypes((prev) =>
                    prev.includes(opType) ? prev.filter((t) => t !== opType) : [...prev, opType]
                  );
                }}
              >
                <span className={filterOperationTypes.includes(opType) ? 'font-semibold' : ''}>
                  {filterOperationTypes.includes(opType) ? '✓ ' : ''}{getOperationTypeLabel(opType)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(filterCity || filterType || filterTags.length > 0 || filterRegione || filterOperationTypes.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterCity(null);
              setFilterType(null);
              setFilterTags([]);
              setFilterRegione(null);
              setFilterOperationTypes([]);
            }}
          >
            <X className="w-4 h-4 mr-1" />
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
              {property.codice && (
                <p className="text-xs text-muted-foreground mb-1">Cod: {property.codice}</p>
              )}
              {(property.address.city || property.address.province) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {[property.address.city, property.address.province].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                <TagBadge>{getPropertyTypeLabel(property.type)}</TagBadge>
                {property.category !== 'n/a' && <TagBadge variant="primary">{property.category}</TagBadge>}
                {property.hasIncarico && (
                  <TagBadge variant="success" className="flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    Incarico
                  </TagBadge>
                )}
              </div>
              {property.operationTypes && property.operationTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {property.operationTypes.map((opType) => (
                    <span key={opType} className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded">
                      {getOperationTypeLabel(opType)}
                    </span>
                  ))}
                </div>
              )}
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
              {selectedProperty.codice && (
                <div>
                  <span className="text-muted-foreground">Codice:</span> {selectedProperty.codice}
                </div>
              )}
              {selectedProperty.regione && (
                <div>
                  <span className="text-muted-foreground">Regione:</span> {selectedProperty.regione}
                </div>
              )}
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
            {selectedProperty.operationTypes && selectedProperty.operationTypes.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tipo Operazione</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.operationTypes.map((opType) => (
                    <span key={opType} className="text-sm px-2 py-1 bg-violet-100 text-violet-700 rounded">
                      {getOperationTypeLabel(opType)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedProperty.hasIncarico && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-medium">Incarico</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedProperty.incaricoPercentuale !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Percentuale:</span>{' '}
                      {selectedProperty.incaricoPercentuale}%
                    </div>
                  )}
                  {selectedProperty.incaricoScadenza && (
                    <div>
                      <span className="text-muted-foreground">Scadenza:</span>{' '}
                      {new Date(selectedProperty.incaricoScadenza).toLocaleDateString('it-IT')}
                    </div>
                  )}
                </div>
              </div>
            )}
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

            {/* Attachments Section */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Allegati
                </h4>
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachmentsLoading}
                  >
                    {attachmentsLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    Carica file
                  </Button>
                </div>
              </div>

              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nessun allegato</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                    >
                      <button
                        type="button"
                        className="flex items-center gap-2 flex-1 text-left"
                        onClick={() => openAttachment(attachment.id)}
                      >
                        {getAttachmentIcon(attachment.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.originalFilename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        onClick={() => deleteAttachment(attachment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
