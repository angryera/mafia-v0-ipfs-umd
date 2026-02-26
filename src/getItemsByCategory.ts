/**
 * getItemsByCategory - Fetch items by category in chunks using multicall
 *
 * - 100 items per getItemsByCategory call (chunk size)
 * - Uses viem multicall to batch multiple chunk requests
 * - Stops when a call returns empty itemIds (end of list)
 * - BNB only (MafiaInventory has this function; MafiaInventoryPLS does not)
 * - When categoryId is 15 (cars), typeId maps to CarsList id and car info is added
 */

import { getClient } from './chains.js';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './config.js';
import { CarsList } from './constants/cars.js';
import type { CarType } from './types/CarType.js';

const CAR_CATEGORY_ID = 15;

export interface ParsedItemInfo {
  itemId: number;
  categoryId: number;
  typeId: number;
  owner: `0x${string}`;
  cityId: number;
  /** Present when categoryId is 15 (car items); typeId = CarsList id */
  car?: CarType;
}

/** Viem returns tuple [itemIds, list, cities] - numeric keys 0,1,2 */
type GetItemsByCategoryRaw = readonly [
  readonly (bigint | string)[],
  readonly { categoryId: bigint | string; typeId: bigint | string; owner: `0x${string}` }[],
  readonly (number | bigint)[]
];

const CHUNK_SIZE = 100;
const MULTICALL_BATCH_SIZE = 50;

/**
 * Parse raw getItemsByCategory result into ParsedItemInfo[]
 * Viem returns tuple [itemIds, list, cities]
 * When categoryId is 15, adds car info from CarsList (typeId = car id)
 */
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
      owner: (item?.owner ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
      cityId: Number(cities[index] ?? 0),
    };
    if (isCarCategory) {
      const car = CarsList.find((c) => c.id === typeId);
      if (car) base.car = car;
    }
    return base;
  });
}

function isEmptyResult(raw: GetItemsByCategoryRaw): boolean {
  const itemIds = raw[0];
  return !itemIds || itemIds.length === 0;
}

/** Progress callback: called after each multicall batch */
export type GetItemsProgress = (info: { fetched: number; batchIndex: number }) => void;

/**
 * Fetch all items for a category using chunked multicall.
 *
 * @param categoryId - Category ID to query
 * @param maxItems - Max items to fetch (default 100_000). Stop earlier if empty result.
 * @param onProgress - Optional callback after each batch (for progress bar / logging)
 * @returns Array of parsed item infos. Empty array from contract = end of list.
 */
export async function getItemsByCategory(
  categoryId: number,
  maxItems = 100_000,
  onProgress?: GetItemsProgress
): Promise<ParsedItemInfo[]> {
  const client = getClient('bnb');
  const address = CONTRACT_ADDRESSES.bnb;
  const abi = CONTRACT_ABIS.bnb;

  const allItems: ParsedItemInfo[] = [];
  let startIndex = 0;
  let reachedEnd = false;
  let batchIndex = 0;

  while (!reachedEnd && allItems.length < maxItems) {
    const batchSize = Math.min(
      MULTICALL_BATCH_SIZE,
      Math.ceil((maxItems - allItems.length) / CHUNK_SIZE)
    );

    const contracts = Array.from({ length: batchSize }, (_, i) => {
      const chunkStart = startIndex + i * CHUNK_SIZE;
      return {
        address,
        abi,
        functionName: 'getItemsByCategory' as const,
        args: [BigInt(categoryId), BigInt(chunkStart), BigInt(CHUNK_SIZE)],
      };
    });

    const results = await client.multicall({
      contracts,
      allowFailure: false,
    });

    for (let i = 0; i < results.length; i++) {
      const raw = results[i] as unknown as GetItemsByCategoryRaw;
      if (isEmptyResult(raw)) {
        reachedEnd = true;
        break;
      }
      allItems.push(...parseResult(raw, categoryId));
    }

    startIndex += batchSize * CHUNK_SIZE;
    batchIndex++;
    onProgress?.({ fetched: allItems.length, batchIndex });
  }

  return allItems;
}
