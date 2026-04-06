import { getClient } from '../../core/chains.js';
import { CONTRACTS } from '../../contracts/index.js';
import type { ChainName } from '../../contracts/index.js';

const DEFAULT_PAGE_SIZE = 200;
/** Parallel getListings calls per RPC round trip (listings include bids — keep batches moderate). */
const MULTICALL_BATCH_SIZE = 10;

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
  pageSize = DEFAULT_PAGE_SIZE
): Promise<XpMarketItem[]> {
  const client = getClient(chain);
  const address = CONTRACTS.XpMarket.addresses[chain];
  const abi = CONTRACTS.XpMarket.abi;

  const all: XpMarketItem[] = [];
  let startIndex = 0;
  let reachedEnd = false;

  while (!reachedEnd) {
    const contracts = Array.from({ length: MULTICALL_BATCH_SIZE }, (_, i) => ({
      address,
      abi,
      functionName: 'getListings' as const,
      args: [BigInt(startIndex + i * pageSize), BigInt(pageSize)] as const,
    }));

    const results = await client.multicall({ contracts, allowFailure: false });

    let consumed = 0;
    for (let i = 0; i < results.length; i++) {
      const raw = results[i] as unknown as GetListingsRaw;
      const items = normalizeListings(raw);
      if (items.length === 0) {
        reachedEnd = true;
        break;
      }
      all.push(...items.map(parseItem));
      consumed++;
      if (items.length < pageSize) {
        reachedEnd = true;
        break;
      }
    }

    startIndex += consumed * pageSize;
  }

  return all;
}

