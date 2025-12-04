// [COMPONENT] BuyerDetail - Buyer detail view

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TagBadge } from '@/components/tag-badge';
import { formatCurrency, formatDate, getLevelLabel, getDealStatusLabel, getDealStatusColor } from '@/lib/utils-crm';
import type { Buyer, Deal } from '@/lib/types';
import { Mail, Phone, Calendar, MapPin, Briefcase, Pencil, Trash2 } from 'lucide-react';

interface BuyerDetailProps {
  buyer: Buyer;
  deals: Deal[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BuyerDetail({ buyer, deals, onEdit, onDelete }: BuyerDetailProps) {
  const activeDeals = deals.filter(
    (d) => !['chiuso_positivo', 'chiuso_negativo'].includes(d.status)
  );

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{buyer.name}</h3>
          {buyer.company && <p className="text-muted-foreground">{buyer.company}</p>}
          {buyer.level && (
            <TagBadge variant="primary" className="mt-2">
              {getLevelLabel(buyer.level)}
            </TagBadge>
          )}
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

      {/* Contact Info */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Contatti</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a href={`mailto:${buyer.email}`} className="text-primary hover:underline">
              {buyer.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a href={`tel:${buyer.phone}`} className="text-primary hover:underline">
              {buyer.phone}
            </a>
          </div>
          {buyer.lastContact && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Ultimo contatto: {formatDate(buyer.lastContact)}
            </div>
          )}
        </div>
      </Card>

      {/* Budget & Preferences */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Budget e Preferenze</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatCurrency(buyer.budgetMin)} - {formatCurrency(buyer.budgetMax)}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {buyer.zones.map((zone) => (
                <TagBadge key={zone}>{zone}</TagBadge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tags */}
      {buyer.tags.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tag</h4>
          <div className="flex flex-wrap gap-1">
            {buyer.tags.map((tag) => (
              <TagBadge key={tag} variant="primary">
                {tag}
              </TagBadge>
            ))}
          </div>
        </Card>
      )}

      {/* Deals */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Trattative ({activeDeals.length} attive / {deals.length} totali)
        </h4>
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna trattativa</p>
        ) : (
          <div className="space-y-2">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="text-sm">
                  <p className="font-medium">Trattativa #{deal.id.slice(0, 8)}</p>
                  <p className="text-muted-foreground">{formatDate(deal.createdAt)}</p>
                </div>
                <TagBadge className={getDealStatusColor(deal.status)}>
                  {getDealStatusLabel(deal.status)}
                </TagBadge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notes */}
      {buyer.notes && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Note</h4>
          <p className="text-sm whitespace-pre-wrap">{buyer.notes}</p>
        </Card>
      )}
    </div>
  );
}
