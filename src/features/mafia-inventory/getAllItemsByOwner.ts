import { ITEM_CATEGORY_IDS_TO_SCAN } from '../../constants/itemCategories.js';
import { getItemsByCategory, type ParsedItemInfo } from './getItemsByCategory.js';

export type GetAllItemsByOwnerProgress = (info: {
  categoryId: number;
  categoryIndex: number;
  categoryCount: number;
  fetchedCategoryItems: number;
  matchedOwnerItems: number;
}) => void;

export interface GetAllItemsByOwnerOptions {
  owner: `0x${string}` | string;
  /**
   * Upper bound for each category scan. Defaults to 100k to prevent runaway reads.
   */
  maxItemsPerCategory?: number;
  onProgress?: GetAllItemsByOwnerProgress;
}

/**
 * Fetches items across all categories (except FBI_ASSETS and CAR_ITEM) and filters by owner.
 *
 * Note: This is backed by MafiaInventory.getItemsByCategory, which is BNB-only in this project.
 */
export async function getAllItemsByOwner(
  options: GetAllItemsByOwnerOptions
): Promise<ParsedItemInfo[]> {
  const {
    owner,
    maxItemsPerCategory = 100_000,
    onProgress,
  } = options;

  const ownerLc = String(owner).toLowerCase();
  const matched: ParsedItemInfo[] = [];

  for (let i = 0; i < ITEM_CATEGORY_IDS_TO_SCAN.length; i++) {
    const categoryId = ITEM_CATEGORY_IDS_TO_SCAN[i] ?? 0;

    const items = await getItemsByCategory(
      categoryId,
      maxItemsPerCategory,
      (info) => {
        onProgress?.({
          categoryId,
          categoryIndex: i,
          categoryCount: ITEM_CATEGORY_IDS_TO_SCAN.length,
          fetchedCategoryItems: info.fetched,
          matchedOwnerItems: matched.length,
        });
      }
    );

    for (const item of items) {
      if (String(item.owner).toLowerCase() === ownerLc) {
        matched.push(item);
      }
    }

    onProgress?.({
      categoryId,
      categoryIndex: i,
      categoryCount: ITEM_CATEGORY_IDS_TO_SCAN.length,
      fetchedCategoryItems: items.length,
      matchedOwnerItems: matched.length,
    });
  }

  return matched;
}

