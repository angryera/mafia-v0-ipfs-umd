import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

const DEFAULT_PAGE_SIZE = 200;

export interface RaceInfo {
  id: number;
  startTime: number;
  endTime: number;
  creator: string;
  opponent: string;
  winner: string;
  creatorCarId: number;
  opponentCarId: number;
  cashAmount: number;
  creatorHealthLost: number;
  opponentHealthLost: number;
  cityId: number;
  prizeType: number;
  result: number;
  status: number;
  creatorCarDamagePercent: number;
  opponentCarDamagePercent: number;
}

export interface GetRacesOptions {
  chain: 'bnb' | 'pulse';
  pageSize?: number;
  contractAddress?: string;
  rpcUrl?: string;
}

type RawRace = {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  creator: string;
  opponent: string;
  winner: string;
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

export async function getRaces(options: GetRacesOptions): Promise<RaceInfo[]> {
  const {
    chain,
    pageSize = DEFAULT_PAGE_SIZE,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.MafiaRaceLobby.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaRaceLobby.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const all: RaceInfo[] = [];
  let startIndex = 0;

  while (true) {
    const raw = (await client.readContract({
      address,
      abi,
      functionName: 'getRaces',
      args: [BigInt(startIndex), BigInt(pageSize)],
    })) as unknown as GetRacesRaw;

    const races = raw?.[0] ?? [];
    const creatorCarDamagePercents = raw?.[1] ?? [];
    const opponentCarDamagePercents = raw?.[2] ?? [];
    const page = races.map((race, index) =>
      parseRace(race, creatorCarDamagePercents, opponentCarDamagePercents, index)
    );

    if (page.length === 0) break;
    all.push(...page);
    if (page.length < pageSize) break;
    startIndex += pageSize;
  }

  return all;
}

export const MafiaRaceLobby = { getRaces };

