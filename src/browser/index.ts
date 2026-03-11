/**
 * Unified browser bundle - assigns window.MafiaInventory, window.MafiaProfile, window.MafiaFamily
 */
import { MafiaInventory } from './mafia-inventory.js';
import { MafiaProfile } from './mafia-profile.js';
import { MafiaFamily } from './mafia-family.js';

declare const window: Window & {
  MafiaInventory?: unknown;
  MafiaProfile?: unknown;
  MafiaFamily?: unknown;
};

if (typeof window !== 'undefined') {
  window.MafiaInventory = MafiaInventory;
  window.MafiaProfile = MafiaProfile;
  window.MafiaFamily = MafiaFamily;
}

export { MafiaInventory, MafiaProfile, MafiaFamily };
export { getItemsByCategory } from './mafia-inventory.js';
export { getUsersInfo } from './mafia-profile.js';
export { getFamilies, getPlayersInfo, getFamiliesWithPlayers } from './mafia-family.js';