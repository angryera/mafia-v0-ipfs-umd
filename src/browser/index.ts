/**
 * Unified browser bundle - assigns window.MafiaInventory and window.MafiaProfile
 */
import { MafiaInventory } from './mafia-inventory.js';
import { MafiaProfile } from './mafia-profile.js';

declare const window: Window & { MafiaInventory?: unknown; MafiaProfile?: unknown };

if (typeof window !== 'undefined') {
  window.MafiaInventory = MafiaInventory;
  window.MafiaProfile = MafiaProfile;
}

export { MafiaInventory, MafiaProfile };
export { getItemsByCategory } from './mafia-inventory.js';
export { getUsersInfo } from './mafia-profile.js';
