import { getClient } from '../../core/chains.js';
import { CONTRACTS } from '../../contracts/index.js';
import type { ChainName } from '../../contracts/index.js';

export interface XpBid {
  bidder: `0x${string}`;
  price: bigint;
  timestamp: bigint;
}

export interface XpMarketItem {
  id: bigint;
  xpType: number; // 0: rankxp, 1: kill skill, 2: bustout xp, 3: race xp
  listingType: number; // 0: fixed, 1: auction
  status: number; // 0: active, 1: sold, 2: cancelled
  xpPoint: bigint;
  owner: `0x${string}`;
  buyer: `0x${string}`;
  startPrice: bigint;
  currentPrice: bigint;
  endTimestamp: bigint;
  listingToken: `0x${string}`;
  bids: XpBid[];
}

type RawBid = {
  bidder: `0x${string}`;
  price: bigint;
  timestamp: bigint;
};

type RawItem = {
  id: bigint;
  xpType: number | bigint;
  listingType: number | bigint;
  status: number | bigint;
  xpPoint: bigint;
  owner: `0x${string}`;
  buyer: `0x${string}`;
  startPrice: bigint;
  currentPrice: bigint;
  endTimestamp: bigint;
  listingToken: `0x${string}`;
  bids: readonly RawBid[];
};

type GetListingsRaw = readonly RawItem[] | readonly [readonly RawItem[]];

function normalizeListings(raw: GetListingsRaw): RawItem[] {
  // viem may return a single output directly (RawItem[]) or as tuple ([RawItem[]]).
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  const first = raw[0];
  if (Array.isArray(first)) return first as RawItem[];
  return raw as RawItem[];
}

function parseItem(raw: RawItem): XpMarketItem {
  return {
    id: raw.id ?? 0n,
    xpType: Number(raw.xpType ?? 0),
    listingType: Number(raw.listingType ?? 0),
    status: Number(raw.status ?? 0),
    xpPoint: raw.xpPoint ?? 0n,
    owner: raw.owner ?? '0x0000000000000000000000000000000000000000',
    buyer: raw.buyer ?? '0x0000000000000000000000000000000000000000',
    startPrice: raw.startPrice ?? 0n,
    currentPrice: raw.currentPrice ?? 0n,
    endTimestamp: raw.endTimestamp ?? 0n,
    listingToken: raw.listingToken ?? '0x0000000000000000000000000000000000000000',
    bids: (raw.bids ?? []).map((b) => ({
      bidder: b.bidder ?? '0x0000000000000000000000000000000000000000',
      price: b.price ?? 0n,
      timestamp: b.timestamp ?? 0n,
    })),
  };
}

export async function getListings(
  chain: ChainName,
  startIndex: number,
  length: number
): Promise<XpMarketItem[]> {
  const client = getClient(chain);
  const address = CONTRACTS.XpMarket.addresses[chain];
  const abi = CONTRACTS.XpMarket.abi;

  const raw = (await client.readContract({
    address,
    abi,
    functionName: 'getListings',
    args: [BigInt(startIndex), BigInt(length)],
  })) as unknown as GetListingsRaw;

  return normalizeListings(raw).map(parseItem);
}

