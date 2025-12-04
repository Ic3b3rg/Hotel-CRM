// [COMPONENT] SellerForm - Form for creating/editing sellers

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Seller, CreateSellerRequest } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const sellerSchema = z.object({
  name: z.string().min(2, 'Nome richiesto'),
  company: z.string().optional(),
  email: z.string().email('Email non valida'),
  phone: z.string().min(5, 'Telefono richiesto'),
  role: z.string().optional(),
  contactPreference: z.enum(['telefono', 'email']),
  preferredHours: z.string().optional(),
  notes: z.string().optional(),
});

type SellerFormData = z.infer<typeof sellerSchema>;

interface SellerFormProps {
  onClose: () => void;
  onSubmit: (data: CreateSellerRequest) => Promise<void>;
  initialData?: Seller;
}

export function SellerForm({ onClose, onSubmit, initialData }: SellerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      name: initialData?.name || '',
      company: initialData?.company || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      role: initialData?.role || '',
      contactPreference: initialData?.contactPreference || 'telefono',
      preferredHours: initialData?.preferredHours || '',
      notes: initialData?.notes || '',
    },
  });

  const currentContactPreference = watch('contactPreference');

  const handleFormSubmit = async (data: SellerFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        company: data.company || undefined,
        email: data.email,
        phone: data.phone,
        role: data.role || undefined,
        contactPreference: data.contactPreference,
        preferredHours: data.preferredHours || undefined,
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
          <Input id="company" {...register('company')} placeholder="Nome azienda" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Telefono *</Label>
            <Input id="phone" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="role">Ruolo</Label>
          <Input id="role" {...register('role')} placeholder="Es. Proprietario, Gestore..." />
        </div>

        <div>
          <Label htmlFor="contactPreference">Preferenza contatto</Label>
          <Select value={currentContactPreference} onValueChange={(v) => setValue('contactPreference', v as 'telefono' | 'email')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="telefono">Telefono</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="preferredHours">Orari preferiti</Label>
          <Input id="preferredHours" {...register('preferredHours')} placeholder="Es. 9:00-12:00" />
        </div>

        <div>
          <Label htmlFor="notes">Note</Label>
          <Textarea id="notes" {...register('notes')} rows={3} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditMode ? 'Aggiorna Venditore' : 'Salva Venditore'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
