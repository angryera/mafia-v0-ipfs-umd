import { getClient } from '../../core/chains.js';
import { CONTRACTS } from '../../contracts/index.js';
import type { ChainName } from '../../contracts/index.js';

const CHUNK_SIZE_BY_CHAIN: Record<ChainName, number> = {
  bnb: 100,
  pulse: 50,
};

const MULTICALL_BATCH_SIZE = 25;

export interface IndexedUserItem {
  itemId: number;
  categoryId: number;
  typeId: number;
  owner: `0x${string}`;
  cityId: number;
}

type RawItem = {
  categoryId: bigint;
  typeId: bigint;
  owner: `0x${string}`;
};

type GetUserItemsByCategoryRaw = readonly [readonly bigint[], readonly RawItem[], readonly number[]];

function parsePage(raw: GetUserItemsByCategoryRaw): IndexedUserItem[] {
  const itemIds = raw?.[0] ?? [];
  const list = raw?.[1] ?? [];
  const cities = raw?.[2] ?? [];

  return itemIds.map((id, i) => {
    const item = list[i];
    return {
      itemId: Number(id ?? 0n),
      categoryId: Number(item?.categoryId ?? 0n),
      typeId: Number(item?.typeId ?? 0n),
      owner: (item?.owner ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
      cityId: Number(cities[i] ?? 0),
    };
  });
}

function isEmpty(raw: GetUserItemsByCategoryRaw): boolean {
  return !raw?.[0] || raw[0].length === 0;
}

export type GetIndexedUserItemsProgress = (info: { fetched: number; batchIndex: number }) => void;

export async function getIndexedUserItemsByCategory(options: {
  chain: ChainName;
  user: `0x${string}`;
  categoryId: number;
  startIndex?: number;
  maxItems?: number;
  onProgress?: GetIndexedUserItemsProgress;
}): Promise<IndexedUserItem[]> {
  const {
    chain,
    user,
    categoryId,
    startIndex: inputStartIndex = 0,
    maxItems = Number.POSITIVE_INFINITY,
    onProgress,
  } = options;

  const client = getClient(chain);
  const address = CONTRACTS.MafiaInventoryIndex.addresses[chain];
  const abi = CONTRACTS.MafiaInventoryIndex.abi;
  const CHUNK_SIZE = CHUNK_SIZE_BY_CHAIN[chain];

  const all: IndexedUserItem[] = [];
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
      functionName: 'getUserItemsByCategory' as const,
      args: [
        user,
        BigInt(categoryId),
        BigInt(startIndex + i * CHUNK_SIZE),
        BigInt(CHUNK_SIZE),
      ] as const,
    }));

    const results = await client.multicall({ contracts, allowFailure: false });
    for (const res of results) {
      const raw = res as unknown as GetUserItemsByCategoryRaw;
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

