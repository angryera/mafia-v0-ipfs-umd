import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export interface XpBid {
  bidder: string;
  price: string; // as decimal string (from bigint)
  timestamp: number;
}

export interface XpMarketItem {
  id: string; // bigint as string
  xpType: number;
  listingType: number;
  status: number;
  xpPoint: string;
  owner: string;
  buyer: string;
  startPrice: string;
  currentPrice: string;
  endTimestamp: number;
  listingToken: string;
  bids: XpBid[];
}

export interface GetXpListingsOptions {
  chain: 'bnb' | 'pulse';
  startIndex: number;
  length: number;
  contractAddress?: string;
  rpcUrl?: string;
}

type RawBid = {
  bidder: string;
  price: bigint;
  timestamp: bigint;
};

type RawItem = {
  id: bigint;
  xpType: number | bigint;
  listingType: number | bigint;
  status: number | bigint;
  xpPoint: bigint;
  owner: string;
  buyer: string;
  startPrice: bigint;
  currentPrice: bigint;
  endTimestamp: bigint;
  listingToken: string;
  bids: readonly RawBid[];
};

type GetListingsRaw = readonly RawItem[] | readonly [readonly RawItem[]];

function bigintToString(v: bigint | undefined): string {
  return (v ?? 0n).toString();
}

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
    id: bigintToString(raw.id),
    xpType: Number(raw.xpType ?? 0),
    listingType: Number(raw.listingType ?? 0),
    status: Number(raw.status ?? 0),
    xpPoint: bigintToString(raw.xpPoint),
    owner: raw.owner ?? '0x0000000000000000000000000000000000000000',
    buyer: raw.buyer ?? '0x0000000000000000000000000000000000000000',
    startPrice: bigintToString(raw.startPrice),
    currentPrice: bigintToString(raw.currentPrice),
    endTimestamp: Number(raw.endTimestamp ?? 0n),
    listingToken: raw.listingToken ?? '0x0000000000000000000000000000000000000000',
    bids: (raw.bids ?? []).map((b) => ({
      bidder: b.bidder ?? '0x0000000000000000000000000000000000000000',
      price: bigintToString(b.price),
      timestamp: Number(b.timestamp ?? 0n),
    })),
  };
}

export async function getXpListings(options: GetXpListingsOptions): Promise<XpMarketItem[]> {
  const {
    chain,
    startIndex,
    length,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.XpMarket.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.XpMarket.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = (await client.readContract({
    address,
    abi,
    functionName: 'getListings',
    args: [BigInt(startIndex), BigInt(length)],
  })) as unknown as GetListingsRaw;

  return normalizeListings(raw).map(parseItem);
}

export const XpMarket = { getXpListings };

