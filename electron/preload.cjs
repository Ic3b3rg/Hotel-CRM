// [PRELOAD] Electron preload script - Pure CommonJS
// Espone un'API tipizzata al renderer mantenendo l'isolamento di contesto

console.log('[Preload] Script iniziato');

const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Electron importato', { contextBridge: !!contextBridge, ipcRenderer: !!ipcRenderer });

// IPC Channel constants
const IPC_CHANNELS = {
  BUYERS_GET_ALL: 'buyers:getAll',
  BUYERS_GET_BY_ID: 'buyers:getById',
  BUYERS_CREATE: 'buyers:create',
  BUYERS_UPDATE: 'buyers:update',
  BUYERS_DELETE: 'buyers:delete',
  SELLERS_GET_ALL: 'sellers:getAll',
  SELLERS_GET_BY_ID: 'sellers:getById',
  SELLERS_CREATE: 'sellers:create',
  SELLERS_UPDATE: 'sellers:update',
  SELLERS_DELETE: 'sellers:delete',
  PROPERTIES_GET_ALL: 'properties:getAll',
  PROPERTIES_GET_BY_ID: 'properties:getById',
  PROPERTIES_GET_BY_SELLER: 'properties:getBySeller',
  PROPERTIES_CREATE: 'properties:create',
  PROPERTIES_UPDATE: 'properties:update',
  PROPERTIES_DELETE: 'properties:delete',
  DEALS_GET_ALL: 'deals:getAll',
  DEALS_GET_BY_ID: 'deals:getById',
  DEALS_GET_BY_BUYER: 'deals:getByBuyer',
  DEALS_GET_BY_PROPERTY: 'deals:getByProperty',
  DEALS_CREATE: 'deals:create',
  DEALS_UPDATE: 'deals:update',
  DEALS_UPDATE_STATUS: 'deals:updateStatus',
  DEALS_DELETE: 'deals:delete',
  ACTIVITIES_GET_BY_DEAL: 'activities:getByDeal',
  ACTIVITIES_CREATE: 'activities:create',
  ACTIVITIES_DELETE: 'activities:delete',
  TAGS_GET_ALL: 'tags:getAll',
  TAGS_CREATE: 'tags:create',
  TAGS_DELETE: 'tags:delete',
  STATS_GET_DASHBOARD: 'stats:getDashboard',
  STATS_GET_STALE_DEALS: 'stats:getStaleDeals',
};

// API object
const api = {
  buyers: {
    getAll: (filters) => ipcRenderer.invoke(IPC_CHANNELS.BUYERS_GET_ALL, filters),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.BUYERS_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.BUYERS_CREATE, data),
    update: (data) => ipcRenderer.invoke(IPC_CHANNELS.BUYERS_UPDATE, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.BUYERS_DELETE, id),
  },
  sellers: {
    getAll: (filters) => ipcRenderer.invoke(IPC_CHANNELS.SELLERS_GET_ALL, filters),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.SELLERS_GET_BY_ID, id),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.SELLERS_CREATE, data),
    update: (data) => ipcRenderer.invoke(IPC_CHANNELS.SELLERS_UPDATE, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.SELLERS_DELETE, id),
  },
  properties: {
    getAll: (filters) => ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_GET_ALL, filters),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_GET_BY_ID, id),
    getBySeller: (sellerId) => ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_GET_BY_SELLER, sellerId),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_CREATE, data),
    update: (data) => ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_UPDATE, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.PROPERTIES_DELETE, id),
  },
  deals: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_ALL),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_BY_ID, id),
    getByBuyer: (buyerId) => ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_BY_BUYER, buyerId),
    getByProperty: (propertyId) => ipcRenderer.invoke(IPC_CHANNELS.DEALS_GET_BY_PROPERTY, propertyId),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.DEALS_CREATE, data),
    update: (data) => ipcRenderer.invoke(IPC_CHANNELS.DEALS_UPDATE, data),
    updateStatus: (id, status) => ipcRenderer.invoke(IPC_CHANNELS.DEALS_UPDATE_STATUS, { id, status }),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.DEALS_DELETE, id),
  },
  activities: {
    getByDeal: (dealId) => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITIES_GET_BY_DEAL, dealId),
    create: (data) => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITIES_CREATE, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITIES_DELETE, id),
  },
  tags: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.TAGS_GET_ALL),
    create: (name, color) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_CREATE, { name, color }),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_DELETE, id),
  },
  stats: {
    getDashboard: () => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_DASHBOARD),
    getStaleDeals: (days) => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_STALE_DEALS, days),
  },
};

console.log('[Preload] Esposizione API...');
contextBridge.exposeInMainWorld('api', api);
console.log('[Preload] API esposta con successo!');
