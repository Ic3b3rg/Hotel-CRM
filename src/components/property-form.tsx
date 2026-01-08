// [COMPONENT] PropertyForm - Form for creating/editing properties

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EurInput } from '@/components/ui/eur-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Property, CreatePropertyRequest, Seller, PropertyOperationType } from '@/lib/types';
import { getOperationTypeLabel } from '@/lib/utils-crm';
import { Loader2 } from 'lucide-react';

// Lista dei tipi di operazione disponibili
const OPERATION_TYPES: PropertyOperationType[] = [
  'affitto_attivita',
  'vendita_attivita',
  'affitto_mura',
  'vendita_mura',
  'vendita_cespite',
  'vendita_societa',
];

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

const propertySchema = z.object({
  name: z.string().min(2, 'Nome richiesto (min 2 caratteri)'),
  codice: z.string().optional(),
  sellerId: z.string().min(1, 'Seleziona un venditore'),
  city: z.string().optional(),
  province: z.string().optional(),
  regione: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  cap: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  rooms: z.coerce.number().min(0).optional(),
  beds: z.coerce.number().min(0).optional(),
  condition: z.string().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  hasIncarico: z.boolean().optional(),
  incaricoPercentuale: z.coerce.number().min(0).max(100).optional(),
  incaricoScadenza: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onClose: () => void;
  onSubmit: (data: CreatePropertyRequest) => Promise<void>;
  sellers: Seller[];
  initialData?: Property;
}

export function PropertyForm({ onClose, onSubmit, sellers, initialData }: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<PropertyOperationType[]>(
    initialData?.operationTypes || []
  );
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: initialData?.name || '',
      codice: initialData?.codice || '',
      sellerId: initialData?.sellerId || '',
      city: initialData?.address.city || '',
      province: initialData?.address.province || '',
      regione: initialData?.regione || '',
      street: initialData?.address.street || '',
      number: initialData?.address.number || '',
      cap: initialData?.address.cap || '',
      type: initialData?.type || '',
      category: initialData?.category || '',
      rooms: initialData?.rooms || undefined,
      beds: initialData?.beds || undefined,
      condition: initialData?.condition || '',
      priceMin: initialData?.priceMin || undefined,
      priceMax: initialData?.priceMax || undefined,
      tags: initialData?.tags.join(', ') || '',
      notes: initialData?.notes || '',
      hasIncarico: initialData?.hasIncarico || false,
      incaricoPercentuale: initialData?.incaricoPercentuale || undefined,
      incaricoScadenza: initialData?.incaricoScadenza || '',
    },
  });

  const currentSellerId = watch('sellerId');
  const currentType = watch('type');
  const currentCategory = watch('category');
  const currentCondition = watch('condition');
  const currentRegione = watch('regione');
  const hasIncarico = watch('hasIncarico');
  const priceMinValue = watch('priceMin');
  const priceMaxValue = watch('priceMax');

  const toggleOperationType = (opType: PropertyOperationType) => {
    setSelectedOperationTypes((prev) =>
      prev.includes(opType)
        ? prev.filter((t) => t !== opType)
        : [...prev, opType]
    );
  };

  const handleFormSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        codice: data.codice,
        sellerId: data.sellerId,
        address: {
          street: data.street || '',
          number: data.number || '',
          city: data.city || '',
          cap: data.cap || '',
          province: data.province || '',
          country: 'Italia',
        },
        regione: data.regione,
        type: data.type as CreatePropertyRequest['type'],
        category: data.category as CreatePropertyRequest['category'],
        rooms: data.rooms,
        beds: data.beds,
        condition: data.condition as CreatePropertyRequest['condition'],
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        operationTypes: selectedOperationTypes,
        notes: data.notes,
        hasIncarico: data.hasIncarico,
        incaricoPercentuale: data.hasIncarico ? data.incaricoPercentuale : undefined,
        incaricoScadenza: data.hasIncarico ? data.incaricoScadenza : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome Struttura *</Label>
          <Input id="name" {...register('name')} placeholder="Hotel Roma, B&B Sole..." />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="codice">Codice Immobile</Label>
          <Input id="codice" {...register('codice')} placeholder="Codice identificativo (es: HTL-001)" />
        </div>

        <div>
          <Label htmlFor="sellerId">Venditore *</Label>
          <Select
            value={currentSellerId || ''}
            onValueChange={(value) => setValue('sellerId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona venditore" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((seller) => (
                <SelectItem key={seller.id} value={seller.id}>
                  {seller.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sellerId && <p className="text-sm text-destructive mt-1">{errors.sellerId.message}</p>}
        </div>

        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasIncarico"
              checked={hasIncarico}
              onCheckedChange={(checked) => setValue('hasIncarico', checked === true)}
            />
            <Label htmlFor="hasIncarico" className="font-medium cursor-pointer">
              Incarico
            </Label>
          </div>

          {hasIncarico && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="incaricoPercentuale">Percentuale (%)</Label>
                <Input
                  id="incaricoPercentuale"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register('incaricoPercentuale')}
                  placeholder="Es: 3"
                />
              </div>
              <div>
                <Label htmlFor="incaricoScadenza">Data Scadenza</Label>
                <Input
                  id="incaricoScadenza"
                  type="date"
                  {...register('incaricoScadenza')}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Citta</Label>
            <Input id="city" {...register('city')} placeholder="Roma, Milano..." />
          </div>
          <div>
            <Label htmlFor="province">Provincia</Label>
            <Input id="province" {...register('province')} placeholder="RM, MI..." />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label htmlFor="street">Via</Label>
            <Input id="street" {...register('street')} placeholder="Via Roma" />
          </div>
          <div>
            <Label htmlFor="number">Civico</Label>
            <Input id="number" {...register('number')} placeholder="123" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cap">CAP</Label>
            <Input id="cap" {...register('cap')} placeholder="00100" />
          </div>
          <div>
            <Label htmlFor="regione">Regione</Label>
            <Select value={currentRegione || ''} onValueChange={(value) => setValue('regione', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona regione" />
              </SelectTrigger>
              <SelectContent>
                {REGIONI_ITALIANE.map((regione) => (
                  <SelectItem key={regione} value={regione}>
                    {regione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={currentType || ''} onValueChange={(value) => setValue('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="b&b">B&B</SelectItem>
                <SelectItem value="affittacamere">Affittacamere</SelectItem>
                <SelectItem value="residence">Residence</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={currentCategory || ''} onValueChange={(value) => setValue('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Stelle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1*">1 Stella</SelectItem>
                <SelectItem value="2*">2 Stelle</SelectItem>
                <SelectItem value="3*">3 Stelle</SelectItem>
                <SelectItem value="4*">4 Stelle</SelectItem>
                <SelectItem value="5*">5 Stelle</SelectItem>
                <SelectItem value="n/a">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rooms">Camere</Label>
            <Input
              id="rooms"
              type="number"
              {...register('rooms')}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="beds">Posti letto</Label>
            <Input
              id="beds"
              type="number"
              {...register('beds')}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="condition">Condizione</Label>
          <Select value={currentCondition || ''} onValueChange={(value) => setValue('condition', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona condizione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ottimo">Ottimo</SelectItem>
              <SelectItem value="buono">Buono</SelectItem>
              <SelectItem value="da_ristrutturare">Da ristrutturare</SelectItem>
              <SelectItem value="in_costruzione">In costruzione</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <Label className="font-medium">Tipo Operazione</Label>
          <div className="grid grid-cols-2 gap-3">
            {OPERATION_TYPES.map((opType) => (
              <div key={opType} className="flex items-center space-x-2">
                <Checkbox
                  id={`op-${opType}`}
                  checked={selectedOperationTypes.includes(opType)}
                  onCheckedChange={() => toggleOperationType(opType)}
                />
                <Label htmlFor={`op-${opType}`} className="cursor-pointer text-sm font-normal">
                  {getOperationTypeLabel(opType)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priceMin">Prezzo Minimo (EUR)</Label>
            <EurInput
              id="priceMin"
              value={priceMinValue}
              onChange={(val) => setValue('priceMin', val)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="priceMax">Prezzo Massimo (EUR)</Label>
            <EurInput
              id="priceMax"
              value={priceMaxValue}
              onChange={(val) => setValue('priceMax', val)}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tag</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="mare, centro storico (separati da virgola)"
          />
        </div>

        <div>
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Note aggiuntive..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditMode ? 'Aggiorna Immobile' : 'Salva Immobile'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
