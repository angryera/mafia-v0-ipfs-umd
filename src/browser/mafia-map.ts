/**
 * Browser bundle - MafiaMap contract
 * window.MafiaMap.getSlots({ chain, cityId, ... })
 */
import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

const MAP_WIDTH = 50;
const MAP_HEIGHT = 30;
const BATCH_SIZE = 100;

export interface ParsedSlotInfo {
  cityId: number;
  x: number;
  y: number;
  slotType: number;
  slotSubType: number;
  variant: number;
  rarity: number;
  isOwned: boolean;
  isOperating: boolean;
  originalDefensePower: number;
  defensePower: number;
  boostPercentage: number;
  nextUpgradeAvailableAt: number;
  lastOperatingTimestamp: number;
  inventoryItemId: number;
  familyId: number;
  stakingAmount: number;
  yieldPayout: number;
  owner: string;
}

export interface GetSlotsOptions {
  chain: 'bnb' | 'pulse';
  contractAddress?: string;
  cityId: number;
  rpcUrl?: string;
}

type RawSlot = {
  slotType: number | bigint;
  slotSubType: number | bigint;
  variant: number | bigint;
  rarity: number | bigint;
  isOwned: boolean;
  isOperating: boolean;
  originalDefensePower: number | bigint;
  defensePower: number | bigint;
  boostPercentage: number | bigint;
  nextUpgradeAvailableAt: bigint;
  lastOperatingTimestamp: bigint;
  inventoryItemId: bigint;
  familyId: bigint;
  stakingAmount: bigint;
  yieldPayout: bigint;
};

type GetSlotsRaw = readonly [readonly RawSlot[], readonly string[]];

function parseSlots(
  raw: GetSlotsRaw,
  cityId: number,
  xs: readonly number[],
  ys: readonly number[]
): ParsedSlotInfo[] {
  const slots = raw[0] ?? [];
  const owners = raw[1] ?? [];

  return slots.map((slot, index) => ({
    cityId,
    x: xs[index] ?? 0,
    y: ys[index] ?? 0,
    slotType: Number(slot.slotType ?? 0),
    slotSubType: Number(slot.slotSubType ?? 0),
    variant: Number(slot.variant ?? 0),
    rarity: Number(slot.rarity ?? 0),
    isOwned: Boolean(slot.isOwned),
    isOperating: Boolean(slot.isOperating),
    originalDefensePower: Number(slot.originalDefensePower ?? 0),
    defensePower: Number(slot.defensePower ?? 0),
    boostPercentage: Number(slot.boostPercentage ?? 0),
    nextUpgradeAvailableAt: Number(slot.nextUpgradeAvailableAt ?? 0n),
    lastOperatingTimestamp: Number(slot.lastOperatingTimestamp ?? 0n),
    inventoryItemId: Number(slot.inventoryItemId ?? 0n),
    familyId: Number(slot.familyId ?? 0n),
    stakingAmount: Number(slot.stakingAmount ?? 0n),
    yieldPayout: Number(slot.yieldPayout ?? 0n),
    owner: owners[index] ?? '0x0000000000000000000000000000000000000000',
  }));
}

export async function getSlots(options: GetSlotsOptions): Promise<ParsedSlotInfo[]> {
  const {
    chain,
    contractAddress: customAddress,
    cityId,
    rpcUrl,
  } = options;

  const address = (customAddress ?? CONTRACTS.MafiaMap.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaMap.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const allSlots: ParsedSlotInfo[] = [];

  // Generate all coordinates for 50x30 map
  const allCoords: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      allCoords.push({ x, y });
    }
  }

  // Batch coordinates into chunks
  for (let i = 0; i < allCoords.length; i += BATCH_SIZE) {
    const batch = allCoords.slice(i, i + BATCH_SIZE);
    const cityIds = batch.map(() => cityId);
    const xs = batch.map((c) => c.x);
    const ys = batch.map((c) => c.y);

    const result = await client.readContract({
      address,
      abi,
      functionName: 'getSlots',
      args: [cityIds, xs, ys],
    });

    const raw = result as unknown as GetSlotsRaw;
    const parsed = parseSlots(raw, cityId, xs, ys);
    allSlots.push(...parsed);
  }

  return allSlots;
}

export const MafiaMap = { getSlots };
