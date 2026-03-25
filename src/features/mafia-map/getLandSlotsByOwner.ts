import { getSlots, type ParsedSlotInfo } from './getSlots.js';
import type { ChainName } from '../../contracts/index.js';

export interface GetLandSlotsByOwnerOptions {
  chain: ChainName;
  owner: `0x${string}` | string;
  /**
   * City IDs to scan. (No global city list is defined in this repo.)
   * Example: [1,2,3]
   */
  cityIds: readonly number[];
  /**
   * If true (default), only return slots that have an inventoryItemId (land tile item).
   */
  requireInventoryItem?: boolean;
}

export type GetLandSlotsByOwnerProgress = (info: {
  cityId: number;
  cityIndex: number;
  cityCount: number;
  matchedSlots: number;
}) => void;

/**
 * Scans map slots for each city and returns land slots owned by a given address.
 *
 * "Land slot" here means:
 * - slot.owner matches `owner`
 * - and (by default) slot.inventoryItemId != 0
 */
export async function getLandSlotsByOwner(
  options: GetLandSlotsByOwnerOptions,
  onProgress?: GetLandSlotsByOwnerProgress
): Promise<ParsedSlotInfo[]> {
  const {
    chain,
    owner,
    cityIds,
    requireInventoryItem = true,
  } = options;

  const ownerLc = String(owner).toLowerCase();
  const result: ParsedSlotInfo[] = [];

  for (let i = 0; i < cityIds.length; i++) {
    const cityId = cityIds[i] ?? 0;
    const slots = await getSlots(chain, cityId);
    for (const slot of slots) {
      if (String(slot.owner).toLowerCase() !== ownerLc) continue;
      if (requireInventoryItem && Number(slot.inventoryItemId ?? 0) === 0) continue;
      result.push(slot);
    }
    onProgress?.({
      cityId,
      cityIndex: i,
      cityCount: cityIds.length,
      matchedSlots: result.length,
    });
  }

  return result;
}

