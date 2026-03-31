/**
 * Unified browser bundle - assigns window.MafiaInventory, window.MafiaProfile, window.MafiaFamily, window.MafiaMap, window.MafiaExchange
 */
import { MafiaInventory } from './mafia-inventory.js';
import { MafiaProfile } from './mafia-profile.js';
import { MafiaFamily } from './mafia-family.js';
import { MafiaMap } from './mafia-map.js';
import { MafiaExchange } from './mafia-exchange.js';
import { XpMarket } from './xp-market.js';
import { MafiaInventoryMarketplace } from './inventory-marketplace.js';
import { MafiaRaceLobby } from './race-lobby.js';
import { MafiaRankXp } from './mafia-rank-xp.js';
import { MafiaRaceXp } from './mafia-race-xp.js';
import { MafiaKillSkill } from './mafia-kill-skill.js';
import { BustOutSkill } from './bust-out-skill.js';
import { MafiaEquipment } from './mafia-equipment.js';
import { MafiaBullet } from './mafia-bullet.js';
import { MafiaGameBank } from './mafia-game-bank.js';
import { MafiaHelperCredit } from './mafia-helper-credit.js';
import { MafiaToken } from './mafia-token.js';
import { MafiaWorth } from './worth.js';
import { MafiaPlayerSubscription } from './mafia-player-subscription.js';
import { MafiaPerkManager } from './mafia-perk-manager.js';

declare const window: Window & {
  MafiaInventory?: unknown;
  MafiaProfile?: unknown;
  MafiaFamily?: unknown;
  MafiaMap?: unknown;
  MafiaExchange?: unknown;
  XpMarket?: unknown;
  MafiaInventoryMarketplace?: unknown;
  MafiaRaceLobby?: unknown;
  MafiaRankXp?: unknown;
  MafiaRaceXp?: unknown;
  MafiaKillSkill?: unknown;
  BustOutSkill?: unknown;
  MafiaEquipment?: unknown;
  MafiaBullet?: unknown;
  MafiaGameBank?: unknown;
  MafiaHelperCredit?: unknown;
  MafiaToken?: unknown;
  MafiaWorth?: unknown;
  MafiaPlayerSubscription?: unknown;
  MafiaPerkManager?: unknown;
};

if (typeof window !== 'undefined') {
  window.MafiaInventory = MafiaInventory;
  window.MafiaProfile = MafiaProfile;
  window.MafiaFamily = MafiaFamily;
  window.MafiaMap = MafiaMap;
  window.MafiaExchange = MafiaExchange;
  window.XpMarket = XpMarket;
  window.MafiaInventoryMarketplace = MafiaInventoryMarketplace;
  window.MafiaRaceLobby = MafiaRaceLobby;
  window.MafiaRankXp = MafiaRankXp;
  window.MafiaRaceXp = MafiaRaceXp;
  window.MafiaKillSkill = MafiaKillSkill;
  window.BustOutSkill = BustOutSkill;
  window.MafiaEquipment = MafiaEquipment;
  window.MafiaBullet = MafiaBullet;
  window.MafiaGameBank = MafiaGameBank;
  window.MafiaHelperCredit = MafiaHelperCredit;
  window.MafiaToken = MafiaToken;
  window.MafiaWorth = MafiaWorth;
  window.MafiaPlayerSubscription = MafiaPlayerSubscription;
  window.MafiaPerkManager = MafiaPerkManager;
}

export { MafiaInventory, MafiaProfile, MafiaFamily, MafiaMap, MafiaExchange, XpMarket, MafiaInventoryMarketplace, MafiaRaceLobby, MafiaRankXp, MafiaRaceXp, MafiaKillSkill, BustOutSkill, MafiaEquipment, MafiaBullet, MafiaGameBank, MafiaHelperCredit, MafiaToken, MafiaWorth, MafiaPlayerSubscription, MafiaPerkManager };
export { getItemsByCategory } from './mafia-inventory.js';
export { getAllItemsByOwner } from './mafia-inventory.js';
export { getUsersInfo } from './mafia-profile.js';
export { getFamilies, getPlayersInfo, getFamiliesWithPlayers } from './mafia-family.js';
export { getSlots } from './mafia-map.js';
export { getOTCOffers } from './mafia-exchange.js';
export { getXpListings } from './xp-market.js';
export { getActiveListings as getInventoryMarketplaceActiveListings } from './inventory-marketplace.js';
export { getRaces } from './race-lobby.js';
export { getRankXp, getRankLevel } from './mafia-rank-xp.js';
export { getRaceXp } from './mafia-race-xp.js';
export { getKillSkillXp } from './mafia-kill-skill.js';
export { getBustOutXp } from './bust-out-skill.js';
export { getCitiesTotalPower } from './mafia-equipment.js';
export { balanceOfBullet } from './mafia-bullet.js';
export { balanceOfWithSignMsg } from './mafia-game-bank.js';
export { userSpentCredits } from './mafia-helper-credit.js';
export { balanceOf as getMafiaTokenBalance } from './mafia-token.js';
export { computeWorth } from './worth.js';
export { getSubscriptionInfo } from './mafia-player-subscription.js';
export { getActivePerkInfo } from './mafia-perk-manager.js';