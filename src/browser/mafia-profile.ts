/**
 * Browser bundle - MafiaProfile contract
 * window.MafiaProfile.getUsersInfo({ chain, contractAddress, ... })
 */
import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

const CHUNK_SIZE = 100;
const MULTICALL_BATCH_SIZE = 50;

export interface ParsedUserInfo {
  user: string;
  name: string;
  referrer: string;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface GetUsersInfoOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  maxUsers?: number;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

type GetUsersInfoRaw = readonly [
  readonly string[],
  readonly string[],
  readonly boolean[],
  readonly { gender: number | bigint; country: string }[],
  readonly bigint[],
  readonly string[]
];

function parseResult(raw: GetUsersInfoRaw): ParsedUserInfo[] {
  const users = raw[0] ?? [];
  const names = raw[1] ?? [];
  const isJailed = raw[2] ?? [];
  const extraInfos = raw[3] ?? [];
  const jailedUntil = raw[4] ?? [];
  const referrers = raw[5] ?? [];

  return users.map((user, index) => ({
    user,
    name: names[index] ?? '',
    referrer: referrers[index] ?? '0x0000000000000000000000000000000000000000',
    isJailed: isJailed[index] ?? false,
    gender: Number(extraInfos[index]?.gender ?? 0),
    country: extraInfos[index]?.country ?? '',
    jailedUntil: Number(jailedUntil[index] ?? 0n),
  }));
}

function isEmptyResult(raw: GetUsersInfoRaw): boolean {
  return !raw[0] || raw[0].length === 0;
}

export async function getUsersInfo(options: GetUsersInfoOptions): Promise<ParsedUserInfo[]> {
  const {
    chain,
    contractAddress: customAddress,
    maxUsers = Number.POSITIVE_INFINITY,
    rpcUrl,
    onProgress,
  } = options;

  const address = (customAddress ?? CONTRACTS.MafiaProfile.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaProfile.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const allUsers: ParsedUserInfo[] = [];
  let startIndex = 0;
  let reachedEnd = false;
  let batchIndex = 0;

  while (!reachedEnd && allUsers.length < maxUsers) {
    const batchSize = Math.min(
      MULTICALL_BATCH_SIZE,
      Math.ceil((maxUsers - allUsers.length) / CHUNK_SIZE)
    );

    const contracts = Array.from({ length: batchSize }, (_, i) => {
      const chunkStart = startIndex + i * CHUNK_SIZE;
      return {
        address,
        abi,
        functionName: 'getUsersInfo' as const,
        args: [BigInt(chunkStart), BigInt(CHUNK_SIZE)] as const,
      };
    });

    const results = await client.multicall({ contracts, allowFailure: false });

    for (let i = 0; i < results.length; i++) {
      const raw = results[i] as unknown as GetUsersInfoRaw;
      if (isEmptyResult(raw)) {
        reachedEnd = true;
        break;
      }
      const parsed = parseResult(raw);
      allUsers.push(...parsed);
      if (parsed.length < CHUNK_SIZE) reachedEnd = true;
      if (reachedEnd) break;
    }

    startIndex += batchSize * CHUNK_SIZE;
    batchIndex++;
    onProgress?.({ fetched: allUsers.length, batchIndex });
  }

  const seen = new Set<string>();
  return allUsers.filter((u) => {
    const key = u.user.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const MafiaProfile = { getUsersInfo };
