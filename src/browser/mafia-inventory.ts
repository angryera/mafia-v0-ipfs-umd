/**
 * Browser bundle - configurable chain, contract, params
 * window.MafiaInventory.getItemsByCategory({ chain, contractAddress, categoryId, ... })
 */
import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';
import { pulsechain } from 'viem/chains';
import type { Abi, Chain } from 'viem';
import mafiaInventoryAbi from '../abis/MafiaInventory.json' with { type: 'json' };
import { CarsList } from '../constants/cars.js';

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
}

export interface GetItemsByCategoryOptions {
  chain: 'bnb' | 'pulse';
  contractAddress: string;
  categoryId: number;
  maxItems?: number;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

const DEFAULT_RPC: Record<'bnb' | 'pulse', string> = {
  bnb: 'https://bsc-dataseed.binance.org/',
  pulse: 'https://rpc.pulsechain.com',
};

const CHAINS: Record<'bnb' | 'pulse', Chain> = {
  bnb: bsc,
  pulse: pulsechain,
};

type GetItemsByCategoryRaw = readonly [
  readonly (bigint | string)[],
  readonly { categoryId: bigint | string; typeId: bigint | string; owner: string }[],
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

function isEmptyResult(raw: GetItemsByCategoryRaw): boolean {
  return !raw[0] || raw[0].length === 0;
}

export async function getItemsByCategory(options: GetItemsByCategoryOptions): Promise<ParsedItemInfo[]> {
  const {
    chain,
    contractAddress,
    categoryId,
    maxItems = 100_000,
    rpcUrl: customRpc,
    onProgress,
  } = options;

  if (chain === 'pulse') {
    throw new Error(
      'getItemsByCategory is only available on BNB (MafiaInventory). PulseChain does not have this function.'
    );
  }

  const rpc = customRpc ?? DEFAULT_RPC[chain];
  const viemChain = CHAINS[chain];
  const client = createPublicClient({ chain: viemChain, transport: http(rpc) });
  const address = contractAddress as `0x${string}`;
  const abi = mafiaInventoryAbi as Abi;

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

    const results = await client.multicall({ contracts, allowFailure: false });

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

export const MafiaInventory = { getItemsByCategory };
