import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

const CHUNK_SIZE_BY_CHAIN: Record<'bnb' | 'pulse', number> = {
  bnb: 100,
  pulse: 50,
};

const MULTICALL_BATCH_SIZE = 25;

export interface IndexedItem {
  itemId: number;
  categoryId: number;
  typeId: number;
  owner: string;
  cityId: number;
}

export interface GetIndexedItemsByCategoryOptions {
  chain: 'bnb' | 'pulse';
  categoryId: number;
  startIndex?: number;
  maxItems?: number;
  contractAddress?: string;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

export interface GetIndexedUserItemsByCategoryOptions {
  chain: 'bnb' | 'pulse';
  user: string;
  categoryId: number;
  startIndex?: number;
  maxItems?: number;
  contractAddress?: string;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

export interface GetIndexedActiveItemsOptions {
  chain: 'bnb' | 'pulse';
  startIndex?: number;
  maxItems?: number;
  contractAddress?: string;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

type RawItem = {
  categoryId: bigint;
  typeId: bigint;
  owner: string;
};

type PageRaw = readonly [readonly bigint[], readonly RawItem[], readonly number[]];

function parsePage(raw: PageRaw): IndexedItem[] {
  const itemIds = raw?.[0] ?? [];
  const list = raw?.[1] ?? [];
  const cities = raw?.[2] ?? [];

  return itemIds.map((id, i) => {
    const item = list[i];
    return {
      itemId: Number(id ?? 0n),
      categoryId: Number(item?.categoryId ?? 0n),
      typeId: Number(item?.typeId ?? 0n),
      owner: item?.owner ?? '0x0000000000000000000000000000000000000000',
      cityId: Number(cities[i] ?? 0),
    };
  });
}

function isEmpty(raw: PageRaw): boolean {
  return !raw?.[0] || raw[0].length === 0;
}

async function pagedMulticallLoop(options: {
  chain: 'bnb' | 'pulse';
  rpcUrl?: string;
  address: `0x${string}`;
  abi: Abi;
  functionName: 'getItemsByCategory' | 'getUserItemsByCategory' | 'getActiveItems';
  makeArgs: (startIndex: number, chunkSize: number) => readonly unknown[];
  startIndex?: number;
  maxItems?: number;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}): Promise<IndexedItem[]> {
  const {
    chain,
    rpcUrl,
    address,
    abi,
    functionName,
    makeArgs,
    startIndex: inputStartIndex = 0,
    maxItems = Number.POSITIVE_INFINITY,
    onProgress,
  } = options;

  const client = createBrowserClient(chain, rpcUrl);
  const CHUNK_SIZE = CHUNK_SIZE_BY_CHAIN[chain];

  const all: IndexedItem[] = [];
  let startIndex = Math.max(0, Math.floor(inputStartIndex));
  let reachedEnd = false;
  let batchIndex = 0;

  while (!reachedEnd && all.length < maxItems) {
    const batchSize = Math.min(
      MULTICALL_BATCH_SIZE,
      Math.ceil((maxItems - all.length) / CHUNK_SIZE)
    );

    const contracts = Array.from({ length: batchSize }, (_, i) => ({
      address,
      abi,
      functionName: functionName as never,
      args: makeArgs(startIndex + i * CHUNK_SIZE, CHUNK_SIZE) as never,
    }));

    const results = await client.multicall({ contracts, allowFailure: false });
    for (const res of results) {
      const raw = res as unknown as PageRaw;
      if (isEmpty(raw)) {
        reachedEnd = true;
        break;
      }
      const page = parsePage(raw);
      all.push(...page);
      if (page.length < CHUNK_SIZE) {
        reachedEnd = true;
        break;
      }
    }

    startIndex += batchSize * CHUNK_SIZE;
    batchIndex += 1;
    onProgress?.({ fetched: all.length, batchIndex });
  }

  const seen = new Set<number>();
  return all.filter((x) => {
    if (seen.has(x.itemId)) return false;
    seen.add(x.itemId);
    return true;
  });
}

export async function getItemsByCategory(options: GetIndexedItemsByCategoryOptions): Promise<IndexedItem[]> {
  const {
    chain,
    categoryId,
    contractAddress: customAddress,
    rpcUrl,
    ...rest
  } = options;

  const address = (customAddress ?? CONTRACTS.MafiaInventoryIndex.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaInventoryIndex.abi as Abi;

  return pagedMulticallLoop({
    chain,
    rpcUrl,
    address,
    abi,
    functionName: 'getItemsByCategory',
    makeArgs: (startIndex, chunkSize) => [BigInt(categoryId), BigInt(startIndex), BigInt(chunkSize)] as const,
    ...rest,
  });
}

export async function getUserItemsByCategory(
  options: GetIndexedUserItemsByCategoryOptions
): Promise<IndexedItem[]> {
  const {
    chain,
    user,
    categoryId,
    contractAddress: customAddress,
    rpcUrl,
    ...rest
  } = options;

  const address = (customAddress ?? CONTRACTS.MafiaInventoryIndex.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaInventoryIndex.abi as Abi;

  return pagedMulticallLoop({
    chain,
    rpcUrl,
    address,
    abi,
    functionName: 'getUserItemsByCategory',
    makeArgs: (startIndex, chunkSize) =>
      [user as `0x${string}`, BigInt(categoryId), BigInt(startIndex), BigInt(chunkSize)] as const,
    ...rest,
  });
}

export async function getActiveItems(options: GetIndexedActiveItemsOptions): Promise<IndexedItem[]> {
  const {
    chain,
    contractAddress: customAddress,
    rpcUrl,
    ...rest
  } = options;

  const address = (customAddress ?? CONTRACTS.MafiaInventoryIndex.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaInventoryIndex.abi as Abi;

  return pagedMulticallLoop({
    chain,
    rpcUrl,
    address,
    abi,
    functionName: 'getActiveItems',
    makeArgs: (startIndex, chunkSize) => [BigInt(startIndex), BigInt(chunkSize)] as const,
    ...rest,
  });
}

export const MafiaInventoryIndex = { getItemsByCategory, getUserItemsByCategory, getActiveItems };

