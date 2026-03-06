/**
 * getUsersInfo - Chunked multicall for MafiaProfile
 * Fetches user profiles in batch using getUsersInfo(startIndex, length)
 */
import { getClient } from '../../core/chains.js';
import { MAFIA_PROFILE_ADDRESSES, MAFIA_PROFILE_ABI } from '../../config/index.js';
import type { ChainName } from '../../core/chains.js';

const CHUNK_SIZE = 100;
const MULTICALL_BATCH_SIZE = 50;

export interface UserExtraInfo {
  gender: number;
  country: string;
}

export interface ParsedUserInfo {
  user: `0x${string}`;
  name: string;
  isJailed: boolean;
  gender: number;
  country: string;
}

type GetUsersInfoRaw = readonly [
  readonly `0x${string}`[],
  readonly string[],
  readonly boolean[],
  readonly { gender: number | bigint; country: string }[]
];

function parseResult(raw: GetUsersInfoRaw): ParsedUserInfo[] {
  const users = raw[0] ?? [];
  const names = raw[1] ?? [];
  const isJailed = raw[2] ?? [];
  const extraInfos = raw[3] ?? [];

  return users.map((user, index) => ({
    user: user as `0x${string}`,
    name: names[index] ?? '',
    isJailed: isJailed[index] ?? false,
    gender: Number(extraInfos[index]?.gender ?? 0),
    country: extraInfos[index]?.country ?? '',
  }));
}

function isEmptyResult(raw: GetUsersInfoRaw): boolean {
  return !raw[0] || raw[0].length === 0;
}

export type GetUsersInfoProgress = (info: { fetched: number; batchIndex: number }) => void;

export async function getUsersInfo(
  chain: ChainName,
  maxUsers = 100_000,
  onProgress?: GetUsersInfoProgress
): Promise<ParsedUserInfo[]> {
  const client = getClient(chain);
  const address = MAFIA_PROFILE_ADDRESSES[chain];
  const abi = MAFIA_PROFILE_ABI;

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
      allUsers.push(...parseResult(raw));
    }

    startIndex += batchSize * CHUNK_SIZE;
    batchIndex++;
    onProgress?.({ fetched: allUsers.length, batchIndex });
  }

  // Remove duplicates by user address (keep first occurrence)
  const seen = new Set<string>();
  return allUsers.filter((u) => {
    const key = u.user.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
