// [COMPONENT] ActivityForm - Form for adding activities to a deal

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
import type { CreateActivityRequest, ActivityType } from '@/lib/types';
import { Loader2, Phone, Mail, Calendar, FileText, Clock } from 'lucide-react';

const activitySchema = z.object({
  type: z.string().min(1, 'Seleziona un tipo'),
  date: z.string().min(1, 'Data richiesta'),
  description: z.string().min(1, 'Descrizione richiesta'),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  dealId: string;
  onSubmit: (data: CreateActivityRequest) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean;
}

const activityTypes: { value: ActivityType; label: string; icon: typeof Phone }[] = [
  { value: 'nota', label: 'Nota', icon: FileText },
  { value: 'chiamata', label: 'Chiamata', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'appuntamento', label: 'Appuntamento', icon: Calendar },
  { value: 'follow_up', label: 'Follow-up', icon: Clock },
];

export function ActivityForm({ dealId, onSubmit, onCancel, compact = false }: ActivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: 'nota',
      date: today,
      description: '',
    },
  });

  const handleFormSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        dealId,
        type: data.type as ActivityType,
        date: new Date(data.date).toISOString(),
        description: data.description,
      });
      reset({ type: 'nota', date: today, description: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
        <div className="flex gap-2">
          <div className="w-32">
            <Select defaultValue="nota" onValueChange={(value) => setValue('type', value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <type.icon className="w-3.5 h-3.5" />
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="date"
            {...register('date')}
            className="w-36 h-9"
          />
        </div>
        <Textarea
          {...register('description')}
          placeholder="Cosa e successo? (es: Mario mi ha detto che...)"
          rows={2}
          className="resize-none"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Aggiungi
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
              Annulla
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo *</Label>
          <Select defaultValue="nota" onValueChange={(value) => setValue('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona tipo" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="date">Data *</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
          />
          {errors.date && (
            <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrizione *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Cosa e successo? (es: Il compratore mi ha detto che...)"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Aggiungi Attivita
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Annulla
          </Button>
        )}
      </div>
    </form>
  );
}
