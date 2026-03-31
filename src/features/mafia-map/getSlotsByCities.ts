import { getSlots, type ParsedSlotInfo } from './getSlots.js';
import type { ChainName } from '../../contracts/index.js';

export interface GetSlotsByCitiesOptions {
  chain: ChainName;
  cityIds: readonly number[];
}

export type GetSlotsByCitiesProgress = (info: {
  cityId: number;
  cityIndex: number;
  cityCount: number;
  fetchedSlots: number;
}) => void;

/**
 * Scans all map slots for each city and returns ALL slots (no owner filter).
 */
export async function getSlotsByCities(
  options: GetSlotsByCitiesOptions,
  onProgress?: GetSlotsByCitiesProgress
): Promise<ParsedSlotInfo[]> {
  const { chain, cityIds } = options;
  const result: ParsedSlotInfo[] = [];

  for (let i = 0; i < cityIds.length; i++) {
    const cityId = cityIds[i] ?? 0;
    const slots = await getSlots(chain, cityId);
    result.push(...slots);
    onProgress?.({
      cityId,
      cityIndex: i,
      cityCount: cityIds.length,
      fetchedSlots: result.length,
    });
  }

  return result;
}

