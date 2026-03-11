/**
 * Browser bundle - MafiaFamily contract
 * window.MafiaFamily.getFamilies({ chain, contractAddress, ... })
 */
import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

const CHUNK_SIZE = 100;
const MULTICALL_BATCH_SIZE = 50;

export interface ParsedFamilyInfo {
  familyId: number;
  leaders: string[];
  successor: string;
  leaveFee: number;
  memberCount: number;
  isDead: boolean;
  name: string;
}

export interface GetFamiliesOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  maxFamilies?: number;
  rpcUrl?: string;
  onProgress?: (info: { fetched: number; batchIndex: number }) => void;
}

type RawFamilyInfo = {
  familyId: bigint;
  leaders: readonly string[];
  successor: string;
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
    leaders: (fam.leaders ?? []) as string[],
    successor: fam.successor ?? '0x0000000000000000000000000000000000000000',
    leaveFee: Number(fam.leaveFee ?? 0n),
    memberCount: Number(fam.memberCount ?? 0n),
    isDead: Boolean(fam.isDead),
    name: names[index] ?? '',
  }));
}

function isEmptyResult(raw: GetFamiliesRaw): boolean {
  return !raw[0] || raw[0].length === 0;
}

export async function getFamilies(options: GetFamiliesOptions): Promise<ParsedFamilyInfo[]> {
  const {
    chain,
    contractAddress: customAddress,
    maxFamilies = Number.POSITIVE_INFINITY,
    rpcUrl,
    onProgress,
  } = options;

  const address = (customAddress ?? CONTRACTS.MafiaFamily.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaFamily.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

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

export interface ParsedPlayerInfo {
  user: string;
  familyId: number;
  level: number; // PlayerLevel enum as number
  isDead: boolean;
}

export interface GetPlayersInfoOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  users: string[];
  rpcUrl?: string;
}

type RawPlayerInfo = {
  familyId: bigint;
  level: number | bigint;
  isDead: boolean;
};

type GetPlayersInfoRaw = readonly RawPlayerInfo[];

const PLAYERS_BATCH_SIZE = 100; // Maximum addresses per call

function parsePlayersResult(
  raw: GetPlayersInfoRaw,
  users: readonly string[]
): ParsedPlayerInfo[] {
  return raw.map((player, index) => ({
    user: users[index] ?? '0x0000000000000000000000000000000000000000',
    familyId: Number(player.familyId ?? 0n),
    level: Number(player.level ?? 0),
    isDead: Boolean(player.isDead),
  }));
}

export async function getPlayersInfo(
  options: GetPlayersInfoOptions
): Promise<ParsedPlayerInfo[]> {
  const {
    chain,
    contractAddress: customAddress,
    users,
    rpcUrl,
  } = options;

  if (users.length === 0) {
    return [];
  }

  const address = (customAddress ?? CONTRACTS.MafiaFamily.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaFamily.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const allPlayers: ParsedPlayerInfo[] = [];

  // Batch users into chunks to avoid exceeding contract limits
  for (let i = 0; i < users.length; i += PLAYERS_BATCH_SIZE) {
    const batch = users.slice(i, i + PLAYERS_BATCH_SIZE);
    const batchUsers = batch as `0x${string}`[];

    const result = await client.readContract({
      address,
      abi,
      functionName: 'getPlayersInfo',
      args: [batchUsers],
    });

    const raw = result as unknown as GetPlayersInfoRaw;
    const parsed = parsePlayersResult(raw, batch);
    allPlayers.push(...parsed);
  }

  return allPlayers;
}

export interface EnrichedLeaderInfo {
  address: string;
  role: string; // Don, Consigliere, Capodecina, Capo, etc.
  name: string;
  familyId: number;
  level: number;
  isDead: boolean;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface EnrichedSuccessorInfo {
  address: string;
  name: string;
  familyId: number;
  level: number;
  isDead: boolean;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface EnrichedPlayerInfo {
  address: string;
  name: string;
  familyId: number;
  level: number;
  isDead: boolean;
  isJailed: boolean;
  gender: number;
  country: string;
  jailedUntil: number;
}

export interface EnrichedFamilyInfo extends Omit<ParsedFamilyInfo, 'leaders' | 'successor'> {
  leaders: EnrichedLeaderInfo[];
  successor: EnrichedSuccessorInfo;
  players: EnrichedPlayerInfo[]; // All members of this family
}

export interface GetFamiliesWithPlayersOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  maxFamilies?: number;
  maxUsers?: number;
  rpcUrl?: string;
  onProgress?: (info: {
    step: 'users' | 'families' | 'players';
    fetched: number;
    batchIndex?: number;
  }) => void;
}

export async function getFamiliesWithPlayers(
  options: GetFamiliesWithPlayersOptions
): Promise<EnrichedFamilyInfo[]> {
  const {
    chain,
    contractAddress: customAddress,
    maxFamilies = Number.POSITIVE_INFINITY,
    maxUsers = Number.POSITIVE_INFINITY,
    rpcUrl,
    onProgress,
  } = options;

  // Import getUsersInfo dynamically to avoid circular dependency
  const { getUsersInfo } = await import('./mafia-profile.js');

  // Step 1: Get all users (player list) from profile contract
  const users = await getUsersInfo({
    chain,
    maxUsers,
    rpcUrl,
    onProgress: (info) => {
      onProgress?.({ step: 'users', ...info });
    },
  });

  // Step 2: Get all families from family contract
  const families = await getFamilies({
    chain,
    contractAddress: customAddress,
    maxFamilies,
    rpcUrl,
    onProgress: (info) => {
      onProgress?.({ step: 'families', ...info });
    },
  });

  if (families.length === 0) {
    return [];
  }

  // Step 3: Get player info for all users from family contract
  const userAddresses = users.map((u) => u.user);
  const playersInfo = await getPlayersInfo({
    chain,
    contractAddress: customAddress,
    users: userAddresses,
    rpcUrl,
  });
  onProgress?.({ step: 'players', fetched: playersInfo.length });

  // Step 4: Build lookup maps
  // Map: address -> user profile
  const userMap = new Map<string, typeof users[0]>();
  users.forEach((u) => {
    userMap.set(u.user.toLowerCase(), u);
  });

  // Map: address -> player info
  const playerInfoMap = new Map<string, ParsedPlayerInfo>();
  playersInfo.forEach((p) => {
    playerInfoMap.set(p.user.toLowerCase(), p);
  });

  // Step 5: Build enriched families with detailed player lists
  const roleNames = ['Don', 'Consigliere', 'Capodecina', 'Capo', 'Capo', 'Capo', 'Capo', 'Capo'];
  
  return families.map((family) => {
    // Enrich leaders with profile info
    const enrichedLeaders: EnrichedLeaderInfo[] = family.leaders.map((addr, index) => {
      const user = userMap.get(addr.toLowerCase());
      const playerInfo = playerInfoMap.get(addr.toLowerCase());
      return {
        address: addr,
        role: roleNames[index] || `Capo ${index - 2}`,
        name: user?.name ?? '',
        familyId: playerInfo?.familyId ?? 0,
        level: playerInfo?.level ?? 0,
        isDead: playerInfo?.isDead ?? false,
        isJailed: user?.isJailed ?? false,
        gender: user?.gender ?? 0,
        country: user?.country ?? '',
        jailedUntil: user?.jailedUntil ?? 0,
      };
    });

    // Enrich successor with profile info
    const successorUser = userMap.get(family.successor.toLowerCase());
    const successorPlayerInfo = playerInfoMap.get(family.successor.toLowerCase());
    const enrichedSuccessor: EnrichedSuccessorInfo = {
      address: family.successor,
      name: successorUser?.name ?? '',
      familyId: successorPlayerInfo?.familyId ?? 0,
      level: successorPlayerInfo?.level ?? 0,
      isDead: successorPlayerInfo?.isDead ?? false,
      isJailed: successorUser?.isJailed ?? false,
      gender: successorUser?.gender ?? 0,
      country: successorUser?.country ?? '',
      jailedUntil: successorUser?.jailedUntil ?? 0,
    };

    // Get all players (members) of this family (filter out familyId 0 = no family)
    const familyPlayers: EnrichedPlayerInfo[] = [];
    playerInfoMap.forEach((playerInfo, playerAddr) => {
      if (playerInfo.familyId === family.familyId && playerInfo.familyId !== 0) {
        const user = userMap.get(playerAddr);
        if (user) {
          familyPlayers.push({
            address: playerAddr,
            name: user.name,
            familyId: playerInfo.familyId,
            level: playerInfo.level,
            isDead: playerInfo.isDead,
            isJailed: user.isJailed,
            gender: user.gender,
            country: user.country,
            jailedUntil: user.jailedUntil,
          });
        }
      }
    });

    return {
      ...family,
      leaders: enrichedLeaders,
      successor: enrichedSuccessor,
      players: familyPlayers,
    };
  });
}

export const MafiaFamily = { getFamilies, getPlayersInfo, getFamiliesWithPlayers };

