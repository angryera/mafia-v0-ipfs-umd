/**
 * getPlayersInfo - Batch call for MafiaFamily
 * Fetches player family info for multiple addresses using getPlayersInfo(address[] memory users)
 */
import { getClient } from '../../core/chains.js';
import { CONTRACTS } from '../../contracts/index.js';
import type { ChainName } from '../../contracts/index.js';

const BATCH_SIZE = 100; // Maximum addresses per multicall

export interface ParsedPlayerInfo {
  user: `0x${string}`;
  familyId: number;
  level: number; // PlayerLevel enum as number
  isDead: boolean;
}

type RawPlayerInfo = {
  familyId: bigint;
  level: number | bigint;
  isDead: boolean;
};

type GetPlayersInfoRaw = readonly RawPlayerInfo[];

function parseResult(
  raw: GetPlayersInfoRaw,
  users: readonly `0x${string}`[]
): ParsedPlayerInfo[] {
  return raw.map((player, index) => ({
    user: users[index] ?? ('0x0000000000000000000000000000000000000000' as `0x${string}`),
    familyId: Number(player.familyId ?? 0n),
    level: Number(player.level ?? 0),
    isDead: Boolean(player.isDead),
  }));
}

export async function getPlayersInfo(
  chain: ChainName,
  users: readonly `0x${string}`[]
): Promise<ParsedPlayerInfo[]> {
  if (users.length === 0) {
    return [];
  }

  const client = getClient(chain);
  const address = CONTRACTS.MafiaFamily.addresses[chain];
  const abi = CONTRACTS.MafiaFamily.abi;

  const allPlayers: ParsedPlayerInfo[] = [];

  // Batch users into chunks to avoid exceeding multicall limits
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchUsers = batch as `0x${string}`[];

    const result = await client.readContract({
      address,
      abi,
      functionName: 'getPlayersInfo',
      args: [batchUsers],
    });

    const raw = result as unknown as GetPlayersInfoRaw;
    const parsed = parseResult(raw, batchUsers);
    allPlayers.push(...parsed);
  }

  return allPlayers;
}
