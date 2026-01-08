// [PAGE] Dashboard - Main dashboard page
// Mostra statistiche, trattative attive e azioni rapide

import { useStats, useStaleDeals } from '@/hooks/use-stats';
import { useDeals } from '@/hooks/use-deals';
import { useBuyers } from '@/hooks/use-buyers';
import { useProperties } from '@/hooks/use-properties';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { TagBadge } from '@/components/tag-badge';
import {
  Users,
  UserCheck,
  Building2,
  Handshake,
  AlertTriangle,
  TrendingUp,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { getDealStatusLabel, getDealStatusColor, formatDate } from '@/lib/utils-crm';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { stats, loading: statsLoading } = useStats();
  const { staleDeals } = useStaleDeals(30);
  const { deals } = useDeals();
  const { buyers } = useBuyers();
  const { properties } = useProperties();

  // Trattative attive (non chiuse)
  const activeDeals = deals.filter(
    (d) => !['chiuso_positivo', 'chiuso_negativo'].includes(d.status)
  );

  // Helper per ottenere nomi
  const getBuyerName = (buyerId: string) => buyers.find((b) => b.id === buyerId)?.name || 'N/D';
  const getPropertyName = (propertyId: string) =>
    properties.find((p) => p.id === propertyId)?.name || 'N/D';

  // Helper per calcolare i giorni alla scadenza incarico
  const getDaysToExpiration = (scadenza: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expirationDate = new Date(scadenza);
    expirationDate.setHours(0, 0, 0, 0);
    const diffTime = expirationDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper per il colore del badge scadenza
  const getExpirationColor = (days: number): string => {
    if (days < 0) return 'bg-red-100 text-red-700'; // Scaduto
    if (days <= 14) return 'bg-orange-100 text-orange-700'; // 1-14 giorni
    if (days <= 30) return 'bg-yellow-100 text-yellow-700'; // 15-30 giorni
    return 'bg-green-100 text-green-700'; // >30 giorni
  };

  // Helper per il testo della scadenza
  const getExpirationText = (days: number): string => {
    if (days < 0) return `Scaduto da ${Math.abs(days)}gg`;
    if (days === 0) return 'Scade oggi';
    if (days === 1) return 'Scade domani';
    return `${days}gg alla scadenza`;
  };

  // Filtra immobili con incarico e data scadenza, ordinati per scadenza più vicina
  const propertiesWithExpiringIncarico = properties
    .filter((p) => p.hasIncarico && p.incaricoScadenza)
    .map((p) => ({
      ...p,
      daysToExpiration: getDaysToExpiration(p.incaricoScadenza!),
    }))
    .sort((a, b) => a.daysToExpiration - b.daysToExpiration);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Panoramica delle attività CRM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Compratori" value={stats?.totalBuyers || 0} icon={Users} />
        <StatCard title="Venditori" value={stats?.totalSellers || 0} icon={UserCheck} />
        <StatCard title="Immobili" value={stats?.totalProperties || 0} icon={Building2} />
        <StatCard title="Trattative Attive" value={stats?.activeDeals || 0} icon={Handshake} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trattative Attive */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trattative Attive
            </h2>
            <Link to="/trattative" className="text-sm text-primary hover:underline">
              Vedi tutte
            </Link>
          </div>

          {activeDeals.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessuna trattativa attiva</p>
          ) : (
            <div className="space-y-3">
              {activeDeals.slice(0, 5).map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{getPropertyName(deal.propertyId)}</p>
                    <p className="text-xs text-muted-foreground">{getBuyerName(deal.buyerId)}</p>
                  </div>
                  <TagBadge className={getDealStatusColor(deal.status)}>
                    {getDealStatusLabel(deal.status)}
                  </TagBadge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Trattative Ferme */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Trattative Ferme (&gt;30gg)
            </h2>
            <span className="text-sm text-muted-foreground">{staleDeals.length} trattative</span>
          </div>

          {staleDeals.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessuna trattativa ferma</p>
          ) : (
            <div className="space-y-3">
              {staleDeals.slice(0, 5).map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{getPropertyName(deal.propertyId)}</p>
                    <p className="text-xs text-muted-foreground">
                      Ultimo aggiornamento: {formatDate(deal.updatedAt)}
                    </p>
                  </div>
                  <TagBadge variant="warning">{getDealStatusLabel(deal.status)}</TagBadge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Scadenze Incarichi */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-green-600" />
              Scadenze Incarichi
            </h2>
            <Link to="/immobili" className="text-sm text-primary hover:underline">
              Vedi tutti
            </Link>
          </div>

          {propertiesWithExpiringIncarico.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun incarico attivo</p>
          ) : (
            <div className="space-y-3">
              {propertiesWithExpiringIncarico.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{property.name}</p>
                    {property.codice && (
                      <p className="text-xs text-muted-foreground">Cod: {property.codice}</p>
                    )}
                  </div>
                  <TagBadge className={getExpirationColor(property.daysToExpiration)}>
                    {getExpirationText(property.daysToExpiration)}
                  </TagBadge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/compratori"
            className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <Users className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium">Nuovo Compratore</span>
          </Link>
          <Link
            to="/venditori"
            className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <UserCheck className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium">Nuovo Venditore</span>
          </Link>
          <Link
            to="/immobili"
            className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <Building2 className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium">Nuovo Immobile</span>
          </Link>
          <Link
            to="/trattative"
            className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <Handshake className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium">Nuova Trattativa</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
