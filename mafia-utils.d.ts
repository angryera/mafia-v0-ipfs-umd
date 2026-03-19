/**
 * Type declarations for browser bundles.
 * - window.MafiaInventory (mafia-inventory.js or mafia-utils.js)
 * - window.MafiaProfile (mafia-profile.js or mafia-utils.js)
 * - window.MafiaFamily (mafia-family.js or mafia-utils.js)
 * - window.MafiaMap (mafia-map.js or mafia-utils.js)
 */

export interface CarType {
  id: number;
  brand: string;
  carName: string;
  image: string;
  qualityLvl: number;
  basePrice: number;
  speed: number;
  seats: number;
}

export interface ParsedItemInfo {
  itemId: number;
  categoryId: number;
  typeId: number;
  owner: string;
  cityId: number;
  car?: CarType;
  damagePercent?: number;
}

export interface GetItemsByCategoryOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  categoryId: number;
  maxItems?: number;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

export interface MafiaInventoryAPI {
  getItemsByCategory(options: GetItemsByCategoryOptions): Promise<ParsedItemInfo[]>;
}

export interface ParsedUserInfo {
  user: string;
  name: string;
  referrer: string;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface GetUsersInfoOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  maxUsers?: number;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

export interface MafiaProfileAPI {
  getUsersInfo(options: GetUsersInfoOptions): Promise<ParsedUserInfo[]>;
}

export interface ParsedFamilyInfo {
  familyId: number;
  leaders: string[];
  successor: string;
  leaveFee: number;
  memberCount: number;
  isDead: boolean;
  name: string;
}

export interface GetFamiliesOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  maxFamilies?: number;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

export interface ParsedPlayerInfo {
  user: string;
  familyId: number;
  level: number; // PlayerLevel enum as number
  isDead: boolean;
}

export interface GetPlayersInfoOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  users: string[];
  rpcUrl?: string;
}

export interface EnrichedLeaderInfo {
  address: string;
  role: string; // Don, Consigliere, Capodecina, Capo, etc.
  name: string;
  familyId: number;
  level: number;
  isDead: boolean;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface EnrichedSuccessorInfo {
  address: string;
  name: string;
  familyId: number;
  level: number;
  isDead: boolean;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface EnrichedPlayerInfo {
  address: string;
  name: string;
  familyId: number;
  level: number;
  isDead: boolean;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface EnrichedFamilyInfo extends Omit<ParsedFamilyInfo, 'leaders' | 'successor'> {
  leaders: EnrichedLeaderInfo[];
  successor: EnrichedSuccessorInfo;
  players: EnrichedPlayerInfo[]; // All members of this family
}

export interface GetFamiliesWithPlayersOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  maxFamilies?: number;
  maxUsers?: number;
  rpcUrl?: string;
  onProgress?: (info: {
    step: 'users' | 'families' | 'players';
    fetched: number;
    batchIndex?: number;
  }) => void;
}

export interface MafiaFamilyAPI {
  getFamilies(options: GetFamiliesOptions): Promise<ParsedFamilyInfo[]>;
  getPlayersInfo(options: GetPlayersInfoOptions): Promise<ParsedPlayerInfo[]>;
  getFamiliesWithPlayers(options: GetFamiliesWithPlayersOptions): Promise<EnrichedFamilyInfo[]>;
}

export interface ParsedSlotInfo {
  cityId: number;
  x: number;
  y: number;
  slotType: number;
  slotSubType: number;
  variant: number;
  rarity: number;
  isOwned: boolean;
  isOperating: boolean;
  originalDefensePower: number;
  defensePower: number;
  boostPercentage: number;
  nextUpgradeAvailableAt: number;
  lastOperatingTimestamp: number;
  inventoryItemId: number;
  familyId: number;
  stakingAmount: number;
  yieldPayout: number;
  owner: string;
}

export interface GetSlotsOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  cityId: number;
  rpcUrl?: string;
}

export interface MafiaMapAPI {
  getSlots(options: GetSlotsOptions): Promise<ParsedSlotInfo[]>;
}

declare global {
  interface Window {
    MafiaInventory: MafiaInventoryAPI;
    MafiaProfile: MafiaProfileAPI;
    MafiaFamily: MafiaFamilyAPI;
    MafiaMap: MafiaMapAPI;
  }
}

export {};
