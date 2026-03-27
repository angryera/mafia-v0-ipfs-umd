import { getClient } from '../../core/chains.js';
import { CONTRACTS } from '../../contracts/index.js';
import type { ChainName } from '../../contracts/index.js';

const DEFAULT_PAGE_SIZE = 200;

export interface MarketplaceBid {
  buyer: `0x${string}`;
  price: number;
  amount: number;
  timestamp: number;
}

export interface MarketplaceListing {
  itemId: number;
  listingType: number; // 0: fixed, 1: auction
  startingPrice: number;
  currentPrice: number;
  timestamp: number;
  expiresAt: number;
  token: `0x${string}`;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  status: number; // 0: open, 1: sold, 2: canceled
  bids: MarketplaceBid[];
  item: InventoryItem;
}

export interface InventoryItem {
  categoryId: number;
  typeId: number;
  owner: `0x${string}`;
}

type RawBid = {
  buyer: `0x${string}`;
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
  token: `0x${string}`;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  status: bigint | number;
  bids: readonly RawBid[];
};

type RawItem = {
  categoryId: bigint;
  typeId: bigint;
  owner: `0x${string}`;
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
    item: items[idx] ?? {
      categoryId: 0,
      typeId: 0,
      owner: '0x0000000000000000000000000000000000000000',
    },
  }));
}

export async function getActiveListings(
  chain: ChainName,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<MarketplaceListing[]> {
  const client = getClient(chain);
  const address = CONTRACTS.MafiaInventoryMarketplace.addresses[chain];
  const abi = CONTRACTS.MafiaInventoryMarketplace.abi;

  const count = (await client.readContract({
    address,
    abi,
    functionName: 'getActiveListingCount',
    args: [],
  })) as bigint;

  const total = Number(count);
  if (total === 0) {
    return [];
  }

  const listings: Omit<MarketplaceListing, 'item'>[] = [];
  const items: InventoryItem[] = [];

  for (let startIndex = 0; startIndex < total; startIndex += pageSize) {
    const remaining = total - startIndex;
    const size = Math.min(pageSize, remaining);
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

