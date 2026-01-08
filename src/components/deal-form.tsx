// [COMPONENT] DealForm - Form for creating/editing deals

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { EurInput } from '@/components/ui/eur-input';
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
import type { Deal, CreateDealRequest, DealStatus, DealOggetto, PagamentoStatus } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { getDealStatusLabel, getDealOggettoLabel, getPagamentoStatusLabel } from '@/lib/utils-crm';
import { Checkbox } from '@/components/ui/checkbox';

const dealSchema = z.object({
  buyerId: z.string().min(1, 'Seleziona un compratore'),
  propertyId: z.string().min(1, 'Seleziona un immobile'),
  oggetto: z.enum(['vendita', 'affitto', 'gestione'], { required_error: 'Seleziona un oggetto' }),
  status: z.string().optional(),
  prezzoRichiesto: z.coerce.number().min(0).optional(),
  priceOffered: z.coerce.number().min(0).optional(),
  priceNegotiated: z.coerce.number().min(0).optional(),
  provvigioneCompratore: z.coerce.number().min(0).max(100).optional(),
  collaboratoreCompratore: z.string().optional(),
  provvigioneVenditore: z.coerce.number().min(0).max(100).optional(),
  collaboratoreVenditore: z.string().optional(),
  pagamentoCompratore: z.enum(['si', 'no', 'rateale']).optional(),
  accontoCompratore: z.boolean().optional(),
  pagamentoVenditore: z.enum(['si', 'no', 'rateale']).optional(),
  accontoVenditore: z.boolean().optional(),
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
      oggetto: (initialData?.oggetto ? initialData.oggetto : undefined) as DealOggetto | undefined,
      status: initialData?.status || 'nuovo_contatto',
      prezzoRichiesto: initialData?.prezzoRichiesto || undefined,
      priceOffered: initialData?.priceOffered || undefined,
      priceNegotiated: initialData?.priceNegotiated || undefined,
      provvigioneCompratore: initialData?.provvigioneCompratore || undefined,
      collaboratoreCompratore: initialData?.collaboratoreCompratore || '',
      provvigioneVenditore: initialData?.provvigioneVenditore || undefined,
      collaboratoreVenditore: initialData?.collaboratoreVenditore || '',
      pagamentoCompratore: initialData?.pagamentoCompratore || undefined,
      accontoCompratore: initialData?.accontoCompratore || false,
      pagamentoVenditore: initialData?.pagamentoVenditore || undefined,
      accontoVenditore: initialData?.accontoVenditore || false,
      notes: initialData?.notes || '',
    },
  });

  const currentBuyerId = watch('buyerId');
  const currentPropertyId = watch('propertyId');
  const currentOggetto = watch('oggetto');
  const currentStatus = watch('status');
  const prezzoRichiestoValue = watch('prezzoRichiesto');
  const priceOfferedValue = watch('priceOffered');
  const priceNegotiatedValue = watch('priceNegotiated');
  const currentPagamentoCompratore = watch('pagamentoCompratore');
  const currentAccontoCompratore = watch('accontoCompratore');
  const currentPagamentoVenditore = watch('pagamentoVenditore');
  const currentAccontoVenditore = watch('accontoVenditore');

  const handleFormSubmit = async (data: DealFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        buyerId: data.buyerId,
        propertyId: data.propertyId,
        oggetto: data.oggetto,
        status: data.status as DealStatus,
        prezzoRichiesto: data.prezzoRichiesto,
        priceOffered: data.priceOffered,
        priceNegotiated: data.priceNegotiated,
        provvigioneCompratore: data.provvigioneCompratore,
        collaboratoreCompratore: data.collaboratoreCompratore,
        provvigioneVenditore: data.provvigioneVenditore,
        collaboratoreVenditore: data.collaboratoreVenditore,
        pagamentoCompratore: data.pagamentoCompratore,
        accontoCompratore: data.accontoCompratore,
        pagamentoVenditore: data.pagamentoVenditore,
        accontoVenditore: data.accontoVenditore,
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

        <div>
          <Label htmlFor="oggetto">Oggetto *</Label>
          <Select value={currentOggetto || ''} onValueChange={(value) => setValue('oggetto', value as DealOggetto)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona oggetto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vendita">{getDealOggettoLabel('vendita')}</SelectItem>
              <SelectItem value="affitto">{getDealOggettoLabel('affitto')}</SelectItem>
              <SelectItem value="gestione">{getDealOggettoLabel('gestione')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.oggetto && (
            <p className="text-sm text-destructive mt-1">{errors.oggetto.message}</p>
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
          <Label htmlFor="prezzoRichiesto">Prezzo Richiesto (EUR)</Label>
          <EurInput
            id="prezzoRichiesto"
            value={prezzoRichiestoValue}
            onChange={(val) => setValue('prezzoRichiesto', val)}
            placeholder="0"
          />
        </div>

        <div>
          <Label htmlFor="priceOffered">Prezzo Offerto (EUR)</Label>
          <EurInput
            id="priceOffered"
            value={priceOfferedValue}
            onChange={(val) => setValue('priceOffered', val)}
            placeholder="0"
          />
        </div>

        {isEditMode && (
          <div>
            <Label htmlFor="priceNegotiated">Prezzo Negoziato (EUR)</Label>
            <EurInput
              id="priceNegotiated"
              value={priceNegotiatedValue}
              onChange={(val) => setValue('priceNegotiated', val)}
              placeholder="0"
            />
          </div>
        )}

        {/* Sezione Provvigioni */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-sm">Provvigioni</h3>

          {/* Provvigione Compratore */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Compratore</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="provvigioneCompratore">Provvigione (%)</Label>
                <Input
                  id="provvigioneCompratore"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register('provvigioneCompratore')}
                  placeholder="Es: 1,5"
                />
              </div>
              <div>
                <Label htmlFor="collaboratoreCompratore">Collaboratore</Label>
                <Input
                  id="collaboratoreCompratore"
                  {...register('collaboratoreCompratore')}
                  placeholder="Nome collaboratore"
                />
              </div>
            </div>
          </div>

          {/* Provvigione Venditore */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Venditore</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="provvigioneVenditore">Provvigione (%)</Label>
                <Input
                  id="provvigioneVenditore"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register('provvigioneVenditore')}
                  placeholder="Es: 1,5"
                />
              </div>
              <div>
                <Label htmlFor="collaboratoreVenditore">Collaboratore</Label>
                <Input
                  id="collaboratoreVenditore"
                  {...register('collaboratoreVenditore')}
                  placeholder="Nome collaboratore"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sezione Pagamenti */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-sm">Pagamenti</h3>

          {/* Pagamento Compratore */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Compratore</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pagamentoCompratore">Pagato</Label>
                <Select
                  value={currentPagamentoCompratore || ''}
                  onValueChange={(value) => setValue('pagamentoCompratore', value as PagamentoStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">{getPagamentoStatusLabel('si')}</SelectItem>
                    <SelectItem value="no">{getPagamentoStatusLabel('no')}</SelectItem>
                    <SelectItem value="rateale">{getPagamentoStatusLabel('rateale')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="accontoCompratore"
                  checked={currentAccontoCompratore || false}
                  onCheckedChange={(checked) => setValue('accontoCompratore', checked === true)}
                />
                <Label htmlFor="accontoCompratore" className="cursor-pointer">Acconto</Label>
              </div>
            </div>
          </div>

          {/* Pagamento Venditore */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Venditore</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pagamentoVenditore">Pagato</Label>
                <Select
                  value={currentPagamentoVenditore || ''}
                  onValueChange={(value) => setValue('pagamentoVenditore', value as PagamentoStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">{getPagamentoStatusLabel('si')}</SelectItem>
                    <SelectItem value="no">{getPagamentoStatusLabel('no')}</SelectItem>
                    <SelectItem value="rateale">{getPagamentoStatusLabel('rateale')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="accontoVenditore"
                  checked={currentAccontoVenditore || false}
                  onCheckedChange={(checked) => setValue('accontoVenditore', checked === true)}
                />
                <Label htmlFor="accontoVenditore" className="cursor-pointer">Acconto</Label>
              </div>
            </div>
          </div>
        </div>

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
