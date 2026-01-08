// [IPC] Channel constants for Electron IPC communication
// Definisce tutti i canali IPC usando la convenzione entity:action

export const IPC_CHANNELS = {
  // Buyers
  BUYERS_GET_ALL: 'buyers:getAll',
  BUYERS_GET_BY_ID: 'buyers:getById',
  BUYERS_CREATE: 'buyers:create',
  BUYERS_UPDATE: 'buyers:update',
  BUYERS_DELETE: 'buyers:delete',

  // Sellers
  SELLERS_GET_ALL: 'sellers:getAll',
  SELLERS_GET_BY_ID: 'sellers:getById',
  SELLERS_CREATE: 'sellers:create',
  SELLERS_UPDATE: 'sellers:update',
  SELLERS_DELETE: 'sellers:delete',

  // Properties
  PROPERTIES_GET_ALL: 'properties:getAll',
  PROPERTIES_GET_BY_ID: 'properties:getById',
  PROPERTIES_GET_BY_SELLER: 'properties:getBySeller',
  PROPERTIES_CREATE: 'properties:create',
  PROPERTIES_UPDATE: 'properties:update',
  PROPERTIES_DELETE: 'properties:delete',

  // Deals
  DEALS_GET_ALL: 'deals:getAll',
  DEALS_GET_BY_ID: 'deals:getById',
  DEALS_GET_BY_BUYER: 'deals:getByBuyer',
  DEALS_GET_BY_PROPERTY: 'deals:getByProperty',
  DEALS_CREATE: 'deals:create',
  DEALS_UPDATE: 'deals:update',
  DEALS_UPDATE_STATUS: 'deals:updateStatus',
  DEALS_DELETE: 'deals:delete',

  // Activities
  ACTIVITIES_GET_BY_DEAL: 'activities:getByDeal',
  ACTIVITIES_CREATE: 'activities:create',
  ACTIVITIES_DELETE: 'activities:delete',

  // Tags
  TAGS_GET_ALL: 'tags:getAll',
  TAGS_CREATE: 'tags:create',
  TAGS_DELETE: 'tags:delete',

  // Property Attachments
  PROPERTY_ATTACHMENTS_GET_BY_PROPERTY: 'propertyAttachments:getByProperty',
  PROPERTY_ATTACHMENTS_CREATE: 'propertyAttachments:create',
  PROPERTY_ATTACHMENTS_DELETE: 'propertyAttachments:delete',
  PROPERTY_ATTACHMENTS_OPEN: 'propertyAttachments:open',
  PROPERTY_ATTACHMENTS_SAVE_FILE: 'propertyAttachments:saveFile',

  // Stats
  STATS_GET_DASHBOARD: 'stats:getDashboard',
  STATS_GET_STALE_DEALS: 'stats:getStaleDeals',
} as const;

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
