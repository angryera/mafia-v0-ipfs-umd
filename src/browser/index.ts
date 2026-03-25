/**
 * Unified browser bundle - assigns window.MafiaInventory, window.MafiaProfile, window.MafiaFamily, window.MafiaMap, window.MafiaExchange
 */
import { MafiaInventory } from './mafia-inventory.js';
import { MafiaProfile } from './mafia-profile.js';
import { MafiaFamily } from './mafia-family.js';
import { MafiaMap } from './mafia-map.js';
import { MafiaExchange } from './mafia-exchange.js';

declare const window: Window & {
  MafiaInventory?: unknown;
  MafiaProfile?: unknown;
  MafiaFamily?: unknown;
  MafiaMap?: unknown;
  MafiaExchange?: unknown;
};

if (typeof window !== 'undefined') {
  window.MafiaInventory = MafiaInventory;
  window.MafiaProfile = MafiaProfile;
  window.MafiaFamily = MafiaFamily;
  window.MafiaMap = MafiaMap;
  window.MafiaExchange = MafiaExchange;
}

export { MafiaInventory, MafiaProfile, MafiaFamily, MafiaMap, MafiaExchange };
export { getItemsByCategory } from './mafia-inventory.js';
export { getUsersInfo } from './mafia-profile.js';
export { getFamilies, getPlayersInfo, getFamiliesWithPlayers } from './mafia-family.js';
export { getSlots } from './mafia-map.js';
export { getOTCOffers } from './mafia-exchange.js';