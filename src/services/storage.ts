import { LargeCategory, MediumCategory, MasterItem, DailyShoppingList } from '../types';
import { DEFAULT_LARGE_CATEGORIES, DEFAULT_MEDIUM_CATEGORIES, DEFAULT_MASTER_ITEMS } from '../data/defaultPresets';

export const APP_STORAGE_KEY_PREFIX = 'shopping_app_';

export const STORAGE_KEYS = {
  LARGE_CATEGORIES: 'shopping_app_large_categories_v1',
  MEDIUM_CATEGORIES: 'shopping_app_medium_categories_v1',
  MASTER_ITEMS: 'shopping_app_master_items_v1',
  SHOPPING_LISTS: 'shopping_app_daily_lists_v1',
} as const;

export const getStoredLargeCategories = (): LargeCategory[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LARGE_CATEGORIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (e) {
    console.error('Failed to load large categories', e);
  }
  return DEFAULT_LARGE_CATEGORIES;
};

export const saveLargeCategories = (categories: LargeCategory[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LARGE_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save large categories', e);
  }
};

export const getStoredMediumCategories = (): MediumCategory[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEDIUM_CATEGORIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (e) {
    console.error('Failed to load medium categories', e);
  }
  return DEFAULT_MEDIUM_CATEGORIES;
};

export const saveMediumCategories = (categories: MediumCategory[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEDIUM_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save medium categories', e);
  }
};

export const getStoredMasterItems = (): MasterItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MASTER_ITEMS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load master items', e);
  }
  return DEFAULT_MASTER_ITEMS;
};

export const saveMasterItems = (items: MasterItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MASTER_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save master items', e);
  }
};

export const getStoredShoppingLists = (): Record<string, DailyShoppingList> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHOPPING_LISTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load shopping lists', e);
  }
  return {};
};

export const saveShoppingListForDate = (date: string, list: DailyShoppingList): Record<string, DailyShoppingList> => {
  const allLists = getStoredShoppingLists();
  allLists[date] = list;
  try {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify(allLists));
  } catch (e) {
    console.error('Failed to save shopping list for date', e);
  }
  return allLists;
};

// A carry-over updates two dates in one write, so a quota failure preserves both dates.
export function saveShoppingListsForDates(...lists: DailyShoppingList[]): Record<string, DailyShoppingList> {
  const raw = localStorage.getItem(STORAGE_KEYS.SHOPPING_LISTS);
  const stored = raw === null ? {} : JSON.parse(raw);
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    throw new Error('Invalid stored shopping lists');
  }

  for (const list of lists) stored[list.date] = list;
  localStorage.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify(stored));
  return stored;
}

export const resetAllDataToDefault = () => {
  localStorage.removeItem(STORAGE_KEYS.LARGE_CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.MEDIUM_CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.MASTER_ITEMS);
  localStorage.removeItem(STORAGE_KEYS.SHOPPING_LISTS);
};
