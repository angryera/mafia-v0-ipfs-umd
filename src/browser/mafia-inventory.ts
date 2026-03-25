/**
 * Browser bundle - MafiaInventory contract
 * window.MafiaInventory.getItemsByCategory({ chain, contractAddress, categoryId, ... })
 */
import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS, getContractAbi } from '../contracts/index.js';
import { CarsList } from '../constants/cars.js';
import { ITEM_CATEGORY_IDS_TO_SCAN } from '../constants/itemCategories.js';

const CAR_CATEGORY_ID = 15;
const CHUNK_SIZE = 100;
const MULTICALL_BATCH_SIZE = 50;

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

export interface GetAllItemsByOwnerOptions {
  chain: 'bnb' | 'pulse';
  owner: string;
  maxItemsPerCategory?: number;
  rpcUrl?: string;
  onProgress?: (info: {
    categoryId: number;
    categoryIndex: number;
    categoryCount: number;
    fetchedCategoryItems: number;
    matchedOwnerItems: number;
  }) => void;
}

type GetItemsByCategoryRaw = readonly [
  readonly (bigint | string)[],
  readonly { categoryId: bigint | string; typeId: bigint | string; owner: string }[],
  readonly (number | bigint)[]
];

type GetCarItemsByCategoryRaw = readonly [
  ...GetItemsByCategoryRaw,
  readonly (number | bigint)[]
];

function parseResult(raw: GetItemsByCategoryRaw, categoryId: number): ParsedItemInfo[] {
  const itemIds = raw[0] ?? [];
  const list = raw[1] ?? [];
  const cities = raw[2] ?? [];
  const isCarCategory = categoryId === CAR_CATEGORY_ID;

  return itemIds.map((itemId, index) => {
    const item = list[index];
    const typeId = Number(item?.typeId ?? 0);
    const base: ParsedItemInfo = {
      itemId: Number(itemId),
      categoryId: Number(item?.categoryId ?? 0),
      typeId,
      owner: item?.owner ?? '0x0000000000000000000000000000000000000000',
      cityId: Number(cities[index] ?? 0),
    };
    if (isCarCategory) {
      const car = CarsList.find((c) => c.id === typeId);
      if (car) base.car = car;
    }
    return base;
  });
}

function parseCarResult(raw: GetCarItemsByCategoryRaw, categoryId: number): ParsedItemInfo[] {
  const damagePercents = raw[3] ?? [];
  const items = parseResult([raw[0], raw[1], raw[2]], categoryId);
  items.forEach((item, index) => {
    const v = damagePercents[index];
    if (v !== undefined) item.damagePercent = Number(v);
  });
  return items;
}

function isEmptyResult(raw: GetItemsByCategoryRaw): boolean {
  return !raw[0] || raw[0].length === 0;
}

function isEmptyCarResult(raw: GetCarItemsByCategoryRaw): boolean {
  return !raw[0] || raw[0].length === 0;
}

export async function getItemsByCategory(options: GetItemsByCategoryOptions): Promise<ParsedItemInfo[]> {
  const {
    chain,
    contractAddress: customAddress,
    categoryId,
    maxItems = Number.POSITIVE_INFINITY,
    rpcUrl,
    onProgress,
  } = options;

  if (chain === 'pulse') {
    throw new Error(
      'getItemsByCategory is only available on BNB (MafiaInventory). PulseChain does not have this function.'
    );
  }

  const address = (customAddress ?? CONTRACTS.MafiaInventory.addresses[chain]) as `0x${string}`;
  const abi = getContractAbi(CONTRACTS.MafiaInventory, chain) as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const allItems: ParsedItemInfo[] = [];
  let startIndex = 0;
  let reachedEnd = false;
  let batchIndex = 0;
  const isCarCategory = categoryId === CAR_CATEGORY_ID;
  const functionName = isCarCategory ? ('getCarItemsByCategory' as const) : ('getItemsByCategory' as const);

  while (!reachedEnd && allItems.length < maxItems) {
    const batchSize = Math.min(
      MULTICALL_BATCH_SIZE,
      Math.ceil((maxItems - allItems.length) / CHUNK_SIZE)
    );

    const contracts = Array.from({ length: batchSize }, (_, i) => {
      const chunkStart = startIndex + i * CHUNK_SIZE;
      const args = isCarCategory
        ? ([BigInt(chunkStart), BigInt(CHUNK_SIZE)] as const)
        : ([BigInt(categoryId), BigInt(chunkStart), BigInt(CHUNK_SIZE)] as const);
      return { address, abi, functionName, args };
    });

    const results = await client.multicall({ contracts, allowFailure: false });

    for (let i = 0; i < results.length; i++) {
      if (isCarCategory) {
        const raw = results[i] as unknown as GetCarItemsByCategoryRaw;
        if (isEmptyCarResult(raw)) {
          reachedEnd = true;
          break;
        }
        const parsed = parseCarResult(raw, categoryId);
        allItems.push(...parsed);
        if (parsed.length < CHUNK_SIZE) reachedEnd = true;
      } else {
        const raw = results[i] as unknown as GetItemsByCategoryRaw;
        if (isEmptyResult(raw)) {
          reachedEnd = true;
          break;
        }
        const parsed = parseResult(raw, categoryId);
        allItems.push(...parsed);
        if (parsed.length < CHUNK_SIZE) reachedEnd = true;
      }
      if (reachedEnd) break;
    }

    startIndex += batchSize * CHUNK_SIZE;
    batchIndex++;
    onProgress?.({ fetched: allItems.length, batchIndex });
  }

  const seen = new Set<number>();
  return allItems.filter((item) => {
    if (seen.has(item.itemId)) return false;
    seen.add(item.itemId);
    return true;
  });
}

export async function getAllItemsByOwner(options: GetAllItemsByOwnerOptions): Promise<ParsedItemInfo[]> {
  const {
    chain,
    owner,
    maxItemsPerCategory = 100_000,
    rpcUrl,
    onProgress,
  } = options;

  if (chain === 'pulse') {
    throw new Error(
      'getAllItemsByOwner is only available on BNB (MafiaInventory.getItemsByCategory). PulseChain does not have this function.'
    );
  }

  const ownerLc = String(owner).toLowerCase();
  const matched: ParsedItemInfo[] = [];

  for (let i = 0; i < ITEM_CATEGORY_IDS_TO_SCAN.length; i++) {
    const categoryId = ITEM_CATEGORY_IDS_TO_SCAN[i] ?? 0;

    const items = await getItemsByCategory({
      chain,
      categoryId,
      maxItems: maxItemsPerCategory,
      rpcUrl,
      onProgress: (info) => {
        onProgress?.({
          categoryId,
          categoryIndex: i,
          categoryCount: ITEM_CATEGORY_IDS_TO_SCAN.length,
          fetchedCategoryItems: info.fetched,
          matchedOwnerItems: matched.length,
        });
      },
    });

    for (const item of items) {
      if (String(item.owner).toLowerCase() === ownerLc) matched.push(item);
    }

    onProgress?.({
      categoryId,
      categoryIndex: i,
      categoryCount: ITEM_CATEGORY_IDS_TO_SCAN.length,
      fetchedCategoryItems: items.length,
      matchedOwnerItems: matched.length,
    });
  }

  return matched;
}

export const MafiaInventory = { getItemsByCategory, getAllItemsByOwner };
