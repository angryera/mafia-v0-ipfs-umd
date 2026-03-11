/**
 * getFamilies - Chunked multicall for MafiaFamily
 * Fetches family info in batch using getFamilies(startIndex, length)
 */
import { getClient } from '../../core/chains.js';
import { CONTRACTS } from '../../contracts/index.js';
import type { ChainName } from '../../contracts/index.js';

const CHUNK_SIZE = 100;
const MULTICALL_BATCH_SIZE = 50;

export interface ParsedFamilyInfo {
  familyId: number;
  leaders: `0x${string}`[];
  successor: `0x${string}`;
  leaveFee: number;
  memberCount: number;
  isDead: boolean;
  name: string;
}

type RawFamilyInfo = {
  familyId: bigint;
  leaders: readonly `0x${string}`[];
  successor: `0x${string}`;
  leaveFee: bigint;
  memberCount: bigint;
  isDead: boolean;
};

type GetFamiliesRaw = readonly [readonly RawFamilyInfo[], readonly string[]];

function parseResult(raw: GetFamiliesRaw): ParsedFamilyInfo[] {
  const list = raw[0] ?? [];
  const names = raw[1] ?? [];

  return list.map((fam, index) => ({
    familyId: Number(fam.familyId ?? 0n),
    leaders: (fam.leaders ?? []) as `0x${string}`[],
    successor: (fam.successor ??
      '0x0000000000000000000000000000000000000000') as `0x${string}`,
    leaveFee: Number(fam.leaveFee ?? 0n),
    memberCount: Number(fam.memberCount ?? 0n),
    isDead: Boolean(fam.isDead),
    name: names[index] ?? '',
  }));
}

function isEmptyResult(raw: GetFamiliesRaw): boolean {
  return !raw[0] || raw[0].length === 0;
}

export type GetFamiliesProgress = (info: { fetched: number; batchIndex: number }) => void;

export async function getFamilies(
  chain: ChainName,
  maxFamilies = 100_000,
  onProgress?: GetFamiliesProgress
): Promise<ParsedFamilyInfo[]> {
  const client = getClient(chain);
  const address = CONTRACTS.MafiaFamily.addresses[chain];
  const abi = CONTRACTS.MafiaFamily.abi;

  const allFamilies: ParsedFamilyInfo[] = [];
  let startIndex = 0;
  let reachedEnd = false;
  let batchIndex = 0;

  while (!reachedEnd && allFamilies.length < maxFamilies) {
    const batchSize = Math.min(
      MULTICALL_BATCH_SIZE,
      Math.ceil((maxFamilies - allFamilies.length) / CHUNK_SIZE)
    );

    const contracts = Array.from({ length: batchSize }, (_, i) => {
      const chunkStart = startIndex + i * CHUNK_SIZE;
      return {
        address,
        abi,
        functionName: 'getFamilies' as const,
        args: [BigInt(chunkStart), BigInt(CHUNK_SIZE)] as const,
      };
    });

    const results = await client.multicall({ contracts, allowFailure: false });

    for (let i = 0; i < results.length; i++) {
      const raw = results[i] as unknown as GetFamiliesRaw;
      if (isEmptyResult(raw)) {
        reachedEnd = true;
        break;
      }
      const parsed = parseResult(raw);
      allFamilies.push(...parsed);
      if (parsed.length < CHUNK_SIZE) reachedEnd = true;
      if (reachedEnd) break;
    }

    startIndex += batchSize * CHUNK_SIZE;
    batchIndex++;
    onProgress?.({ fetched: allFamilies.length, batchIndex });
  }

  const seen = new Set<number>();
  return allFamilies.filter((fam) => {
    if (seen.has(fam.familyId)) return false;
    seen.add(fam.familyId);
    return true;
  });
}

