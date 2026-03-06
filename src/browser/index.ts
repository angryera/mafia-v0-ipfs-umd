/**
 * Unified browser bundle - all contract APIs
 * window.BnbMafia.MafiaInventory.getItemsByCategory(...)
 * window.BnbMafia.MafiaProfile.getUsersInfo(...)
 */
import { MafiaInventory } from './mafia-inventory.js';
import { MafiaProfile } from './mafia-profile.js';

export { MafiaInventory, MafiaProfile };
export { getItemsByCategory } from './mafia-inventory.js';
export { getUsersInfo } from './mafia-profile.js';

export const BnbMafia = {
  MafiaInventory,
  MafiaProfile,
};

export default BnbMafia;
