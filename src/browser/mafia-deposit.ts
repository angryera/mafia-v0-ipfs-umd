import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export interface LiquidityPosition {
  id: string;
  provider: string;
  initialCashAmount: string;
  cashAmount: string;
  cashPerMafia: string;
  mafiaEarned: string;
  mafiaWithdrawn: string;
  active: boolean;
}

export interface GetLiquidityPositionsOptions {
  chain: 'bnb' | 'pulse';
  startIndex?: number;
  length?: number;
  contractAddress?: string;
  rpcUrl?: string;
}

type RawLiquidityPosition = {
  id: bigint;
  provider: string;
  initialCashAmount: bigint;
  cashAmount: bigint;
  cashPerMafia: bigint;
  mafiaEarned: bigint;
  mafiaWithdrawn: bigint;
  active: boolean;
};

function parseLiquidityPosition(raw: RawLiquidityPosition): LiquidityPosition {
  return {
    id: String(raw.id ?? 0n),
    provider: raw.provider,
    initialCashAmount: String(raw.initialCashAmount ?? 0n),
    cashAmount: String(raw.cashAmount ?? 0n),
    cashPerMafia: String(raw.cashPerMafia ?? 0n),
    mafiaEarned: String(raw.mafiaEarned ?? 0n),
    mafiaWithdrawn: String(raw.mafiaWithdrawn ?? 0n),
    active: Boolean(raw.active),
  };
}

export async function getLiquidityPositions(
  options: GetLiquidityPositionsOptions
): Promise<LiquidityPosition[]> {
  const {
    chain,
    startIndex: inputStartIndex,
    length: inputLength,
    contractAddress: customAddress,
    rpcUrl,
  } = options;

  const address = (customAddress ?? CONTRACTS.MafiaDeposit.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaDeposit.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);
  const hasCustomRange = inputStartIndex !== undefined || inputLength !== undefined;
  const requestedStartIndex = Math.max(0, Math.floor(inputStartIndex ?? 0));
  const requestedLength = Math.max(0, Math.floor(inputLength ?? 0));
  const PAGE_SIZE = 500;
  const MULTICALL_BATCH_SIZE = 20;

  async function readRangeWithPaginatedView(
    rangeStart: number,
    rangeLength: number
  ): Promise<LiquidityPosition[]> {
    if (rangeLength === 0) return [];
    const totalChunks = Math.ceil(rangeLength / PAGE_SIZE);
    const list: LiquidityPosition[] = [];

    for (let chunkOffset = 0; chunkOffset < totalChunks; chunkOffset += MULTICALL_BATCH_SIZE) {
      const batchChunks = Math.min(MULTICALL_BATCH_SIZE, totalChunks - chunkOffset);
      const contracts = Array.from({ length: batchChunks }, (_, i) => {
        const chunkIndex = chunkOffset + i;
        const chunkStart = rangeStart + chunkIndex * PAGE_SIZE;
        const consumed = chunkIndex * PAGE_SIZE;
        const chunkLength = Math.min(PAGE_SIZE, rangeLength - consumed);
        return {
          address,
          abi,
          functionName: 'getLiquidityPositions' as const,
          args: [BigInt(chunkStart), BigInt(chunkLength)] as const,
        };
      });

      const results = await client.multicall({ contracts, allowFailure: false });
      for (const raw of results) {
        list.push(...((raw as unknown as readonly RawLiquidityPosition[]).map(parseLiquidityPosition)));
      }
    }

    return list;
  }

  async function readRangeWithArrayGetter(
    rangeStart: number,
    rangeLength: number
  ): Promise<LiquidityPosition[]> {
    if (rangeLength === 0) return [];
    const list: LiquidityPosition[] = [];

    for (let offset = 0; offset < rangeLength; offset += MULTICALL_BATCH_SIZE) {
      const batchSize = Math.min(MULTICALL_BATCH_SIZE, rangeLength - offset);
      const contracts = Array.from({ length: batchSize }, (_, i) => ({
        address,
        abi,
        functionName: 'liquidityPositions' as const,
        args: [BigInt(rangeStart + offset + i)] as const,
      }));
      const results = await client.multicall({ contracts, allowFailure: true });
      for (const result of results as unknown[]) {
        const status = (result as { status?: string }).status;
        if (status === 'failure') return list;
        const raw = (result as { result: unknown }).result as RawLiquidityPosition;
        list.push(parseLiquidityPosition(raw));
      }
    }

    return list;
  }

  async function readAllWithPaginatedView(): Promise<LiquidityPosition[]> {
    const list: LiquidityPosition[] = [];
    let rangeStart = 0;

    while (true) {
      const contracts = Array.from({ length: MULTICALL_BATCH_SIZE }, (_, i) => ({
        address,
        abi,
        functionName: 'getLiquidityPositions' as const,
        args: [BigInt(rangeStart + i * PAGE_SIZE), BigInt(PAGE_SIZE)] as const,
      }));
      const results = await client.multicall({ contracts, allowFailure: false });

      let reachedEnd = false;
      for (const raw of results) {
        const page = (raw as unknown as readonly RawLiquidityPosition[]).map(parseLiquidityPosition);
        if (page.length === 0) {
          reachedEnd = true;
          break;
        }
        list.push(...page);
        if (page.length < PAGE_SIZE) {
          reachedEnd = true;
          break;
        }
      }

      if (reachedEnd) break;
      rangeStart += MULTICALL_BATCH_SIZE * PAGE_SIZE;
    }

    return list;
  }

  if (hasCustomRange) {
    if (requestedLength <= 0) return [];
    try {
      return await readRangeWithPaginatedView(requestedStartIndex, requestedLength);
    } catch {
      return readRangeWithArrayGetter(requestedStartIndex, requestedLength);
    }
  }

  // Default behavior: fetch all listings using 500-sized pages via multicall batches.
  try {
    return await readAllWithPaginatedView();
  } catch {
    return readRangeWithArrayGetter(0, Number.MAX_SAFE_INTEGER);
  }
}

export const MafiaDeposit = { getLiquidityPositions };

