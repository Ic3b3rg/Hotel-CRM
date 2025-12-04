// [COMPONENT] DealForm - Form for creating/editing deals

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBuyers } from '@/hooks/use-buyers';
import { useProperties } from '@/hooks/use-properties';
import type { Deal, CreateDealRequest, DealStatus } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { getDealStatusLabel } from '@/lib/utils-crm';

const dealSchema = z.object({
  buyerId: z.string().min(1, 'Seleziona un compratore'),
  propertyId: z.string().min(1, 'Seleziona un immobile'),
  status: z.string().optional(),
  priceOffered: z.coerce.number().min(0).optional(),
  priceNegotiated: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  onClose: () => void;
  onSubmit: (data: CreateDealRequest) => Promise<void>;
  initialData?: Deal;
}

export function DealForm({ onClose, onSubmit, initialData }: DealFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData;
  const { buyers } = useBuyers();
  const { properties } = useProperties();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      buyerId: initialData?.buyerId || '',
      propertyId: initialData?.propertyId || '',
      status: initialData?.status || 'nuovo_contatto',
      priceOffered: initialData?.priceOffered || undefined,
      priceNegotiated: initialData?.priceNegotiated || undefined,
      notes: initialData?.notes || '',
    },
  });

  const currentBuyerId = watch('buyerId');
  const currentPropertyId = watch('propertyId');
  const currentStatus = watch('status');

  const handleFormSubmit = async (data: DealFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        buyerId: data.buyerId,
        propertyId: data.propertyId,
        status: data.status as DealStatus,
        priceOffered: data.priceOffered,
        priceNegotiated: data.priceNegotiated,
        notes: data.notes,
      } as CreateDealRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="buyerId">Compratore *</Label>
          <Select value={currentBuyerId} onValueChange={(value) => setValue('buyerId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona compratore" />
            </SelectTrigger>
            <SelectContent>
              {buyers.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.id}>
                  {buyer.name} {buyer.company && `(${buyer.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.buyerId && (
            <p className="text-sm text-destructive mt-1">{errors.buyerId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="propertyId">Immobile *</Label>
          <Select value={currentPropertyId} onValueChange={(value) => setValue('propertyId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona immobile" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                  {property.address.city && ` - ${property.address.city}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyId && (
            <p className="text-sm text-destructive mt-1">{errors.propertyId.message}</p>
          )}
        </div>

        {isEditMode && (
          <div>
            <Label htmlFor="status">Stato</Label>
            <Select value={currentStatus} onValueChange={(value) => setValue('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuovo_contatto">{getDealStatusLabel('nuovo_contatto')}</SelectItem>
                <SelectItem value="in_corso">{getDealStatusLabel('in_corso')}</SelectItem>
                <SelectItem value="offerta_inviata">{getDealStatusLabel('offerta_inviata')}</SelectItem>
                <SelectItem value="diligenza">{getDealStatusLabel('diligenza')}</SelectItem>
                <SelectItem value="chiuso_positivo">{getDealStatusLabel('chiuso_positivo')}</SelectItem>
                <SelectItem value="chiuso_negativo">{getDealStatusLabel('chiuso_negativo')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="priceOffered">Prezzo Offerto (EUR)</Label>
          <Input
            id="priceOffered"
            type="number"
            {...register('priceOffered')}
            placeholder="0"
          />
        </div>

        {isEditMode && (
          <div>
            <Label htmlFor="priceNegotiated">Prezzo Negoziato (EUR)</Label>
            <Input
              id="priceNegotiated"
              type="number"
              {...register('priceNegotiated')}
              placeholder="0"
            />
          </div>
        )}

        <div>
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Note sulla trattativa..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditMode ? 'Aggiorna Trattativa' : 'Crea Trattativa'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
