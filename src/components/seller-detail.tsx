// [COMPONENT] SellerDetail - Seller detail view

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TagBadge } from '@/components/tag-badge';
import { formatCurrency, formatDate, getPropertyTypeLabel } from '@/lib/utils-crm';
import type { Seller, Property } from '@/lib/types';
import { Mail, Phone, Calendar, Building2, Clock, Pencil, Trash2 } from 'lucide-react';

interface SellerDetailProps {
  seller: Seller;
  properties: Property[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SellerDetail({ seller, properties, onEdit, onDelete }: SellerDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{seller.name}</h3>
          {seller.company && <p className="text-muted-foreground">{seller.company}</p>}
          {seller.role && <TagBadge className="mt-2">{seller.role}</TagBadge>}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-1" />
                Modifica
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" />
                Elimina
              </Button>
            )}
          </div>
        )}
      </div>

      <Card className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Contatti</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a href={`mailto:${seller.email}`} className="text-primary hover:underline">
              {seller.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a href={`tel:${seller.phone}`} className="text-primary hover:underline">
              {seller.phone}
            </a>
          </div>
          {seller.preferredHours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Orari preferiti: {seller.preferredHours}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Preferenza: {seller.contactPreference === 'telefono' ? 'Telefono' : 'Email'}
          </div>
          {seller.lastContact && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Ultimo contatto: {formatDate(seller.lastContact)}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Immobili ({properties.length})
        </h4>
        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun immobile associato</p>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <div key={property.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{property.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.address.city} • {getPropertyTypeLabel(property.type)} •{' '}
                    {property.rooms} camere
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {formatCurrency(property.priceMin)} - {formatCurrency(property.priceMax)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {seller.notes && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Note</h4>
          <p className="text-sm whitespace-pre-wrap">{seller.notes}</p>
        </Card>
      )}
    </div>
  );
}
