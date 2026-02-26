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
export type { ParsedItemInfo, GetItemsProgress } from './features/mafia-inventory/index.js';

// Re-export config for advanced usage
export { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './config/index.js';
