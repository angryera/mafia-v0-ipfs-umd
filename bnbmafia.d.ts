/**
 * Type declarations for browser bundles.
 * - window.MafiaInventory (mafia-inventory.js)
 * - window.MafiaProfile (mafia-profile.js)
 * - window.BnbMafia (bnbmafia.js) - unified bundle
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
  isJailed: boolean;
  gender: number;
  country: string;
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

export interface BnbMafiaAPI {
  MafiaInventory: MafiaInventoryAPI;
  MafiaProfile: MafiaProfileAPI;
}

declare global {
  interface Window {
    MafiaInventory: MafiaInventoryAPI;
    MafiaProfile: MafiaProfileAPI;
    BnbMafia: BnbMafiaAPI;
  }
}

export {};
