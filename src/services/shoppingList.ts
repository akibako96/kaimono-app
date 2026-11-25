import type { Category, MasterItem, ShoppingListItem } from '../types';

interface ItemGroup {
  key: string;
  name: string;
  items: ShoppingListItem[];
}

function groupByCategory(
  items: readonly ShoppingListItem[],
  categories: readonly Category[],
  getCategoryId: (item: ShoppingListItem) => string,
) {
  const groups = new Map([...categories]
    .sort((a, b) => a.order - b.order)
    .map((category): [string, ItemGroup] => [category.id, {
      key: `category:${category.id}`, name: category.name, items: [],
    }]));
  const unmatched: ItemGroup = { key: 'unmatched', name: 'その他', items: [] };

  for (const item of items) {
    (groups.get(getCategoryId(item)) ?? unmatched).items.push(item);
  }
  return [...groups.values(), unmatched].filter((group) => group.items.length > 0);
}

export function groupShoppingList(
  items: readonly ShoppingListItem[],
  largeCategories: readonly Category[],
  mediumCategories: readonly Category[],
  masterItems: readonly MasterItem[],
) {
  // Management saves the configured master order as array positions.
  const masterOrder = new Map(masterItems.map((item, index) => [item.id, index]));
  const hasOrder = (item: ShoppingListItem) => masterOrder.has(item.masterItemId);

  return groupByCategory(items, largeCategories, (item) => item.largeCategoryId)
    .map(({ items: largeItems, ...largeCategory }) => ({
      ...largeCategory,
      totalCount: largeItems.length,
      checkedCount: largeItems.filter((item) => item.isChecked).length,
      mediumGroups: groupByCategory(largeItems, mediumCategories, (item) => item.mediumCategoryId)
        .map((group) => {
          const ordered = group.items.filter(hasOrder).sort((a, b) =>
            masterOrder.get(a.masterItemId)! - masterOrder.get(b.masterItemId)!,
          );
          // Leave items without master ordering in their original slots.
          let next = 0;
          return { ...group, items: group.items.map((item) => hasOrder(item) ? ordered[next++] : item) };
        }),
    }));
}

export type ShoppingListGroups = ReturnType<typeof groupShoppingList>;

export type ShoppingItemDetails = Pick<ShoppingListItem,
  'name' | 'amount' | 'unit' | 'note' | 'largeCategoryId' | 'mediumCategoryId'
>;

export function editShoppingListItem(items: ShoppingListItem[], id: string, details: ShoppingItemDetails) {
  return items.map((item) => item.id === id ? { ...item, ...details } : item);
}

export function nextShoppingDate(date: string) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
