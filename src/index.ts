/**
 * BNB Mafia IFPS Support
 * Main entry - re-exports and CLI routing
 */

// Re-export core
export {
  getClient,
  getChainInfo,
  readContractValue,
  readOnBnb,
  readOnPulse,
} from './core/index.js';
export type { ChainName } from './core/chains.js';

// Re-export features
export { getItemsByCategory } from './features/mafia-inventory/index.js';
export { getAllItemsByOwner } from './features/mafia-inventory/index.js';
export type {
  ParsedItemInfo,
  GetItemsProgress,
  GetAllItemsByOwnerOptions,
  GetAllItemsByOwnerProgress,
} from './features/mafia-inventory/index.js';
export { getSlots } from './features/mafia-map/index.js';
export { getLandSlotsByOwner } from './features/mafia-map/getLandSlotsByOwner.js';
export type {
  ParsedSlotInfo,
} from './features/mafia-map/index.js';
export type { GetLandSlotsByOwnerOptions, GetLandSlotsByOwnerProgress } from './features/mafia-map/getLandSlotsByOwner.js';
export { getOTCOffers } from './features/mafia-exchange/index.js';
export type {
  OTCRequestItem,
  OTCOffer,
  InventoryItem as OTCOfferInventoryItem,
  OfferedItemDetail,
} from './features/mafia-exchange/index.js';
export { getActiveListings as getInventoryMarketplaceActiveListings } from './features/inventory-marketplace/index.js';
export type {
  MarketplaceListing as InventoryMarketplaceListing,
  MarketplaceBid as InventoryMarketplaceBid,
  InventoryItem as InventoryMarketplaceItem,
} from './features/inventory-marketplace/index.js';

// Re-export config for advanced usage
export { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './config/index.js';
