/**
 * getFamiliesWithPlayers - Combined function that fetches families and enriches them with detailed player info
 * This combines:
 * - getUsersInfo (from MafiaProfile) - to get player list with profile names
 * - getFamilies (from MafiaFamily) - to get family list
 * - getPlayersInfo (from MafiaFamily) - to get player family info
 * Returns enriched families with detailed player lists and leader lists
 */
import { getFamilies } from './getFamilies.js';
import { getPlayersInfo } from './getPlayersInfo.js';
import { getUsersInfo } from '../mafia-profile/getUsersInfo.js';
import type { ChainName } from '../../contracts/index.js';
import type { ParsedFamilyInfo } from './getFamilies.js';
import type { ParsedPlayerInfo } from './getPlayersInfo.js';
import type { ParsedUserInfo } from '../mafia-profile/getUsersInfo.js';

export interface EnrichedLeaderInfo {
  address: `0x${string}`;
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
  address: `0x${string}`;
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
  address: `0x${string}`;
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

export type GetFamiliesWithPlayersProgress = (info: {
  step: 'users' | 'families' | 'players';
  fetched: number;
  batchIndex?: number;
}) => void;

export async function getFamiliesWithPlayers(
  chain: ChainName,
  maxFamilies = 100_000,
  maxUsers = 100_000,
  onProgress?: GetFamiliesWithPlayersProgress
): Promise<EnrichedFamilyInfo[]> {
  // Step 1: Get all users (player list) from profile contract
  const users = await getUsersInfo(chain, maxUsers, (info) => {
    onProgress?.({ step: 'users', ...info });
  });

  // Step 2: Get all families from family contract
  const families = await getFamilies(chain, maxFamilies, (info) => {
    onProgress?.({ step: 'families', ...info });
  });

  if (families.length === 0) {
    return [];
  }

  // Step 3: Get player info for all users from family contract
  const userAddresses = users.map((u) => u.user);
  const playersInfo = await getPlayersInfo(chain, userAddresses);
  onProgress?.({ step: 'players', fetched: playersInfo.length });

  // Step 4: Build lookup maps
  // Map: address -> user profile
  const userMap = new Map<string, ParsedUserInfo>();
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
            address: playerAddr as `0x${string}`,
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
