import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

const DEFAULT_PAGE_SIZE = 200;

export interface MarketplaceBid {
  buyer: string;
  price: number;
  amount: number;
  timestamp: number;
}

export interface MarketplaceListing {
  itemId: number;
  listingType: number;
  startingPrice: number;
  currentPrice: number;
  timestamp: number;
  expiresAt: number;
  token: string;
  seller: string;
  buyer: string;
  status: number;
  bids: MarketplaceBid[];
  item: InventoryItem;
}

export interface InventoryItem {
  categoryId: number;
  typeId: number;
  owner: string;
}

export interface GetActiveListingsOptions {
  chain: 'bnb' | 'pulse';
  pageSize?: number;
  contractAddress?: string;
  rpcUrl?: string;
}

type RawBid = {
  buyer: string;
  price: bigint;
  amount: bigint;
  timestamp: bigint;
};

type RawListing = {
  itemId: bigint;
  listingType: bigint | number;
  startingPrice: bigint;
  currentPrice: bigint;
  timestamp: bigint;
  expiresAt: bigint;
  token: string;
  seller: string;
  buyer: string;
  status: bigint | number;
  bids: readonly RawBid[];
};

type RawItem = {
  categoryId: bigint;
  typeId: bigint;
  owner: string;
};

type GetActiveListingsRaw = readonly [readonly RawListing[], readonly bigint[], readonly RawItem[]];

function toNum(v: bigint | number | undefined): number {
  return Number(v ?? 0);
}

function parseListing(raw: RawListing): Omit<MarketplaceListing, 'item'> {
  return {
    itemId: toNum(raw.itemId),
    listingType: Number(raw.listingType ?? 0),
    startingPrice: toNum(raw.startingPrice),
    currentPrice: toNum(raw.currentPrice),
    timestamp: toNum(raw.timestamp),
    expiresAt: toNum(raw.expiresAt),
    token: raw.token ?? '0x0000000000000000000000000000000000000000',
    seller: raw.seller ?? '0x0000000000000000000000000000000000000000',
    buyer: raw.buyer ?? '0x0000000000000000000000000000000000000000',
    status: Number(raw.status ?? 0),
    bids: (raw.bids ?? []).map((b) => ({
      buyer: b.buyer ?? '0x0000000000000000000000000000000000000000',
      price: toNum(b.price),
      amount: toNum(b.amount),
      timestamp: toNum(b.timestamp),
    })),
  };
}

function parseInventoryItem(raw: RawItem): InventoryItem {
  return {
    categoryId: toNum(raw.categoryId),
    typeId: toNum(raw.typeId),
    owner: raw.owner ?? '0x0000000000000000000000000000000000000000',
  };
}

function attachItemsToListings(
  listings: Omit<MarketplaceListing, 'item'>[],
  items: InventoryItem[]
): MarketplaceListing[] {
  return listings.map((l, idx) => ({
    ...l,
    item: items[idx] ?? { categoryId: 0, typeId: 0, owner: '0x0000000000000000000000000000000000000000' },
  }));
}

export async function getActiveListings(options: GetActiveListingsOptions): Promise<MarketplaceListing[]> {
  const { chain, pageSize = DEFAULT_PAGE_SIZE, contractAddress: customAddress, rpcUrl } = options;
  const address = (customAddress ?? CONTRACTS.MafiaInventoryMarketplace.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaInventoryMarketplace.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const count = (await client.readContract({
    address,
    abi,
    functionName: 'getActiveListingCount',
    args: [],
  })) as bigint;

  const total = Number(count);
  if (total === 0) return [];

  const listings: Omit<MarketplaceListing, 'item'>[] = [];
  const items: InventoryItem[] = [];

  for (let startIndex = 0; startIndex < total; startIndex += pageSize) {
    const size = Math.min(pageSize, total - startIndex);
    const raw = (await client.readContract({
      address,
      abi,
      functionName: 'getActiveListings',
      args: [BigInt(startIndex), BigInt(size)],
    })) as unknown as GetActiveListingsRaw;

    const pageListings = (raw?.[0] ?? []) as RawListing[];
    const pageItems = (raw?.[2] ?? []) as RawItem[];
    listings.push(...pageListings.map(parseListing));
    items.push(...pageItems.map(parseInventoryItem));
  }

  return attachItemsToListings(listings, items);
}

export const MafiaInventoryMarketplace = { getActiveListings };

