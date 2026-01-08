// [TYPES] TypeScript type definitions for the CRM domain
// Tipi per entità, stati e operazioni IPC

// ============================================
// ENUMS & TYPE ALIASES
// ============================================

export type ClientType = 'buyer' | 'seller';

export type PropertyType = 'hotel' | 'b&b' | 'affittacamere' | 'residence' | 'altro';

export type PropertyCategory = '1*' | '2*' | '3*' | '4*' | '5*' | 'n/a';

export type PropertyCondition = 'ottimo' | 'buono' | 'da_ristrutturare' | 'in_costruzione';

export type DealStatus =
  | 'nuovo_contatto'
  | 'in_corso'
  | 'offerta_inviata'
  | 'diligenza'
  | 'chiuso_positivo'
  | 'chiuso_negativo';

export type ActivityType = 'nota' | 'chiamata' | 'email' | 'appuntamento' | 'follow_up';

export type DealOggetto = 'vendita' | 'affitto' | 'gestione';

export type PropertyOperationType =
  | 'affitto_attivita'
  | 'vendita_attivita'
  | 'affitto_mura'
  | 'vendita_mura'
  | 'vendita_cespite'
  | 'vendita_societa';

export type PagamentoStatus = 'si' | 'no' | 'rateale';

export type ContactPreference = 'telefono' | 'email';

export type BuyerLevel = 'privato' | 'fondo' | 'gruppo_alberghiero' | 'investitore';

// ============================================
// ENTITY INTERFACES
// ============================================

export interface PropertyAddress {
  street: string;
  number: string;
  city: string;
  cap: string;
  province: string;
  country: string;
}

export interface Seller {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  role?: string;
  contactPreference: ContactPreference;
  preferredHours?: string;
  notes: string;
  propertyIds: string[];
  lastContact?: Date;
  createdAt: Date;
}

export interface Property {
  id: string;
  name: string;
  codice: string;
  address: PropertyAddress;
  regione: string;
  type: PropertyType;
  category: PropertyCategory;
  rooms: number;
  beds: number;
  condition: PropertyCondition;
  priceMin: number;
  priceMax: number;
  tags: string[];
  operationTypes: PropertyOperationType[];
  notes: string;
  sellerId: string;
  hasIncarico: boolean;
  incaricoPercentuale?: number;
  incaricoScadenza?: string;
  createdAt: Date;
}

export interface Buyer {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  zones: string[];
  preferredTypes: PropertyType[];
  level?: BuyerLevel;
  tags: string[];
  notes: string;
  lastContact?: Date;
  createdAt: Date;
}

export interface Activity {
  id: string;
  date: Date;
  type: ActivityType;
  description: string;
}

export interface Deal {
  id: string;
  buyerId: string;
  propertyId: string;
  status: DealStatus;
  oggetto: DealOggetto | '';
  prezzoRichiesto?: number;
  priceOffered?: number;
  priceNegotiated?: number;
  provvigioneCompratore?: number;
  collaboratoreCompratore?: string;
  provvigioneVenditore?: number;
  collaboratoreVenditore?: string;
  pagamentoCompratore?: PagamentoStatus;
  accontoCompratore?: boolean;
  pagamentoVenditore?: PagamentoStatus;
  accontoVenditore?: boolean;
  notes: string;
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

// ============================================
// DASHBOARD & STATS
// ============================================

export interface DashboardStats {
  totalBuyers: number;
  totalSellers: number;
  totalProperties: number;
  activeDeals: number;
  closedDeals: number;
  staleDeals: number;
}

// ============================================
// IPC REQUEST/RESPONSE TYPES
// ============================================

export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Buyers
export interface CreateBuyerRequest {
  name: string;
  company?: string;
  email: string;
  phone: string;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  zones: string[];
  preferredTypes: PropertyType[];
  level?: BuyerLevel;
  tags: string[];
  notes?: string;
}

export interface UpdateBuyerRequest extends Partial<CreateBuyerRequest> {
  id: string;
}

export interface BuyerFilters {
  search?: string;
  zone?: string;
  level?: BuyerLevel;
  minBudget?: number;
  maxBudget?: number;
}

// Sellers
export interface CreateSellerRequest {
  name: string;
  company?: string;
  email: string;
  phone: string;
  role?: string;
  contactPreference: ContactPreference;
  preferredHours?: string;
  notes?: string;
}

export interface UpdateSellerRequest extends Partial<CreateSellerRequest> {
  id: string;
}

export interface SellerFilters {
  search?: string;
}

// Properties
export interface CreatePropertyRequest {
  name: string;                        // UNICO CAMPO OBBLIGATORIO
  codice?: string;                     // opzionale
  address?: Partial<PropertyAddress>;  // opzionale
  regione?: string;                    // opzionale
  type?: PropertyType;                 // opzionale
  category?: PropertyCategory;         // opzionale
  rooms?: number;                      // opzionale
  beds?: number;                       // opzionale
  condition?: PropertyCondition;       // opzionale
  priceMin?: number;                   // opzionale
  priceMax?: number;                   // opzionale
  tags?: string[];                     // opzionale
  operationTypes?: PropertyOperationType[]; // opzionale
  notes?: string;                      // opzionale
  sellerId?: string;                   // opzionale
  hasIncarico?: boolean;               // opzionale
  incaricoPercentuale?: number;        // opzionale
  incaricoScadenza?: string;           // opzionale (ISO date string)
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  id: string;
}

export interface PropertyFilters {
  search?: string;
  city?: string;
  type?: PropertyType;
  condition?: PropertyCondition;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
}

// Deals
export interface CreateDealRequest {
  buyerId: string;
  propertyId: string;
  oggetto: DealOggetto;
  status?: DealStatus;
  prezzoRichiesto?: number;
  priceOffered?: number;
  provvigioneCompratore?: number;
  collaboratoreCompratore?: string;
  provvigioneVenditore?: number;
  collaboratoreVenditore?: string;
  pagamentoCompratore?: PagamentoStatus;
  accontoCompratore?: boolean;
  pagamentoVenditore?: PagamentoStatus;
  accontoVenditore?: boolean;
  notes?: string;
}

export interface UpdateDealRequest {
  id: string;
  oggetto?: DealOggetto;
  status?: DealStatus;
  prezzoRichiesto?: number;
  priceOffered?: number;
  priceNegotiated?: number;
  provvigioneCompratore?: number;
  collaboratoreCompratore?: string;
  provvigioneVenditore?: number;
  collaboratoreVenditore?: string;
  pagamentoCompratore?: PagamentoStatus;
  accontoCompratore?: boolean;
  pagamentoVenditore?: PagamentoStatus;
  accontoVenditore?: boolean;
  notes?: string;
}

// Activities
export interface CreateActivityRequest {
  dealId: string;
  date: string; // ISO string
  type: ActivityType;
  description: string;
}

// Property Attachments
export interface PropertyAttachment {
  id: string;
  propertyId: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
}

export interface CreatePropertyAttachmentRequest {
  propertyId: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileType?: string;
  fileSize?: number;
}

// ============================================
// EXTENDED ENTITIES (with relations)
// ============================================

export interface DealWithRelations extends Deal {
  buyer?: Buyer;
  property?: Property;
}

export interface PropertyWithSeller extends Property {
  seller?: Seller;
}

export interface BuyerWithDeals extends Buyer {
  deals?: Deal[];
}

export interface SellerWithProperties extends Seller {
  properties?: Property[];
}
