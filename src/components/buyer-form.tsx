// [COMPONENT] BuyerForm - Form for creating/editing buyers

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EurInput } from '@/components/ui/eur-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Buyer, CreateBuyerRequest } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const buyerSchema = z.object({
  name: z.string().min(2, 'Nome richiesto (min 2 caratteri)'),
  company: z.string().optional(),
  email: z.string().email('Email non valida'),
  phone: z.string().min(5, 'Telefono richiesto'),
  budgetMin: z.coerce.number().min(0, 'Budget minimo non valido'),
  budgetMax: z.coerce.number().min(0, 'Budget massimo non valido'),
  zones: z.string().min(1, 'Inserire almeno una zona'),
  level: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

type BuyerFormData = z.infer<typeof buyerSchema>;

interface BuyerFormProps {
  onClose: () => void;
  onSubmit: (data: CreateBuyerRequest) => Promise<void>;
  initialData?: Buyer;
}

export function BuyerForm({ onClose, onSubmit, initialData }: BuyerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      name: initialData?.name || '',
      company: initialData?.company || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      budgetMin: initialData?.budgetMin || 0,
      budgetMax: initialData?.budgetMax || 0,
      zones: initialData?.zones.join(', ') || '',
      level: initialData?.level || '',
      tags: initialData?.tags.join(', ') || '',
      notes: initialData?.notes || '',
    },
  });

  const currentLevel = watch('level');
  const budgetMinValue = watch('budgetMin');
  const budgetMaxValue = watch('budgetMax');

  const handleFormSubmit = async (data: BuyerFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        company: data.company || undefined,
        email: data.email,
        phone: data.phone,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        currency: 'EUR',
        zones: data.zones.split(',').map((z) => z.trim()).filter(Boolean),
        preferredTypes: [],
        level: data.level ? (data.level as CreateBuyerRequest['level']) : undefined,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        notes: data.notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" {...register('name')} placeholder="Nome completo" />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="company">Azienda</Label>
          <Input id="company" {...register('company')} placeholder="Nome azienda (opzionale)" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@esempio.it" />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Telefono *</Label>
            <Input id="phone" {...register('phone')} placeholder="+39 ..." />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budgetMin">Budget Minimo (EUR)</Label>
            <EurInput
              id="budgetMin"
              value={budgetMinValue}
              onChange={(val) => setValue('budgetMin', val ?? 0)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="budgetMax">Budget Massimo (EUR)</Label>
            <EurInput
              id="budgetMax"
              value={budgetMaxValue}
              onChange={(val) => setValue('budgetMax', val ?? 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="zones">Zone di interesse *</Label>
          <Input
            id="zones"
            {...register('zones')}
            placeholder="Roma, Milano, Firenze (separate da virgola)"
          />
          {errors.zones && <p className="text-sm text-destructive mt-1">{errors.zones.message}</p>}
        </div>

        <div>
          <Label htmlFor="level">Livello</Label>
          <Select value={currentLevel} onValueChange={(value) => setValue('level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona livello" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="privato">Investitore Privato</SelectItem>
              <SelectItem value="fondo">Fondo</SelectItem>
              <SelectItem value="gruppo_alberghiero">Gruppo Alberghiero</SelectItem>
              <SelectItem value="investitore">Investitore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tags">Tag</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="luxury, boutique (separati da virgola)"
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
          {isEditMode ? 'Aggiorna Compratore' : 'Salva Compratore'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
