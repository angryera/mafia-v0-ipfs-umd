/**
 * Type declarations for window.MafiaInventory (mafia-inventory.js)
 * Copy dist/mafia-inventory.js and this file to your project for type support
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
}

export interface GetItemsByCategoryOptions {
  chain: 'bnb' | 'pulse';
  contractAddress: string;
  categoryId: number;
  maxItems?: number;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

export interface MafiaInventoryAPI {
  getItemsByCategory(options: GetItemsByCategoryOptions): Promise<ParsedItemInfo[]>;
}

declare global {
  interface Window {
    MafiaInventory: MafiaInventoryAPI;
  }
}

export {};
