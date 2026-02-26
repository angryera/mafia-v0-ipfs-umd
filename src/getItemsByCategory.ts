/**
 * getItemsByCategory - Fetch items by category in chunks using multicall
 *
 * - 100 items per getItemsByCategory call (chunk size)
 * - Uses viem multicall to batch multiple chunk requests
 * - Stops when a call returns empty itemIds (end of list)
 * - BNB only (MafiaInventory has this function; MafiaInventoryPLS does not)
 */

import { getClient } from './chains.js';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './config.js';

export interface ParsedItemInfo {
  itemId: number;
  categoryId: number;
  typeId: number;
  owner: `0x${string}`;
  cityId: number;
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
 */
function parseResult(raw: GetItemsByCategoryRaw): ParsedItemInfo[] {
  const itemIds = raw[0] ?? [];
  const list = raw[1] ?? [];
  const cities = raw[2] ?? [];
  return itemIds.map((itemId, index) => {
    const item = list[index];
    return {
      itemId: Number(itemId),
      categoryId: Number(item?.categoryId ?? 0),
      typeId: Number(item?.typeId ?? 0),
      owner: (item?.owner ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
      cityId: Number(cities[index] ?? 0),
    };
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
      allItems.push(...parseResult(raw));
    }

    startIndex += batchSize * CHUNK_SIZE;
    batchIndex++;
    onProgress?.({ fetched: allItems.length, batchIndex });
  }

  return allItems;
}
