import { getClient } from '../../core/chains.js';
import { CONTRACTS } from '../../contracts/index.js';
import type { ChainName } from '../../contracts/index.js';

const DEFAULT_PAGE_SIZE = 200;
/** Parallel getRaces calls per RPC round trip (smaller than getFamilies — each page is large). */
const MULTICALL_BATCH_SIZE = 10;

export interface RaceInfo {
  id: number;
  startTime: number;
  endTime: number;
  creator: `0x${string}`;
  opponent: `0x${string}`;
  winner: `0x${string}`;
  creatorCarId: number;
  opponentCarId: number;
  cashAmount: number;
  creatorHealthLost: number;
  opponentHealthLost: number;
  cityId: number;
  prizeType: number; // 0: OpponentCar, 1: GameCash
  result: number; // 0: Pending, 1: WinnerWithNoCrash, 2: WinnerWithCrash, 3: BothCrash
  status: number; // 0: Pending, 1: Started, 2: Finished, 3: Cancelled
  creatorCarDamagePercent: number;
  opponentCarDamagePercent: number;
}

type RawRace = {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  creator: `0x${string}`;
  opponent: `0x${string}`;
  winner: `0x${string}`;
  creatorCarId: bigint;
  opponentCarId: bigint;
  cashAmount: bigint;
  creatorHealthLost: bigint;
  opponentHealthLost: bigint;
  cityId: number | bigint;
  prizeType: number | bigint;
  result: number | bigint;
  status: number | bigint;
};

type GetRacesRaw = readonly [readonly RawRace[], readonly (number | bigint)[], readonly (number | bigint)[]];

function toNum(v: bigint | number | undefined): number {
  return Number(v ?? 0);
}

function parseRace(
  raw: RawRace,
  creatorCarDamagePercents: readonly (number | bigint)[],
  opponentCarDamagePercents: readonly (number | bigint)[],
  index: number
): RaceInfo {
  return {
    id: toNum(raw.id),
    startTime: toNum(raw.startTime),
    endTime: toNum(raw.endTime),
    creator: raw.creator ?? '0x0000000000000000000000000000000000000000',
    opponent: raw.opponent ?? '0x0000000000000000000000000000000000000000',
    winner: raw.winner ?? '0x0000000000000000000000000000000000000000',
    creatorCarId: toNum(raw.creatorCarId),
    opponentCarId: toNum(raw.opponentCarId),
    cashAmount: toNum(raw.cashAmount),
    creatorHealthLost: toNum(raw.creatorHealthLost),
    opponentHealthLost: toNum(raw.opponentHealthLost),
    cityId: toNum(raw.cityId),
    prizeType: toNum(raw.prizeType),
    result: toNum(raw.result),
    status: toNum(raw.status),
    creatorCarDamagePercent: toNum(creatorCarDamagePercents[index]),
    opponentCarDamagePercent: toNum(opponentCarDamagePercents[index]),
  };
}

function parsePage(raw: GetRacesRaw): RaceInfo[] {
  const races = raw?.[0] ?? [];
  const creatorCarDamagePercents = raw?.[1] ?? [];
  const opponentCarDamagePercents = raw?.[2] ?? [];
  return races.map((race, index) =>
    parseRace(race, creatorCarDamagePercents, opponentCarDamagePercents, index)
  );
}

export async function getRaces(
  chain: ChainName,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<RaceInfo[]> {
  const client = getClient(chain);
  const address = CONTRACTS.MafiaRaceLobby.addresses[chain];
  const abi = CONTRACTS.MafiaRaceLobby.abi;

  const all: RaceInfo[] = [];
  let startIndex = 0;
  let reachedEnd = false;

  while (!reachedEnd) {
    const contracts = Array.from({ length: MULTICALL_BATCH_SIZE }, (_, i) => ({
      address,
      abi,
      functionName: 'getRaces' as const,
      args: [BigInt(startIndex + i * pageSize), BigInt(pageSize)] as const,
    }));

    const results = await client.multicall({ contracts, allowFailure: false });

    let consumed = 0;
    for (let i = 0; i < results.length; i++) {
      const raw = results[i] as unknown as GetRacesRaw;
      const races = raw?.[0] ?? [];
      if (races.length === 0) {
        reachedEnd = true;
        break;
      }
      all.push(...parsePage(raw));
      consumed++;
      if (races.length < pageSize) {
        reachedEnd = true;
        break;
      }
    }

    startIndex += consumed * pageSize;
  }

  return all;
}

