export interface Category {
  id: string;
  name: string;
  order: number;
}

export type LargeCategory = Category; // 買う場所 (スーパー, ドラッグストア, 100均, etc.)
export type MediumCategory = Category; // 商品分類 (野菜, 果物, 調味料, etc.)

export interface MasterItem {
  id: string;
  name: string;
  largeCategoryId: string;
  mediumCategoryId: string;
  defaultUnit?: string;
  defaultAmount?: number;
  note?: string;
  order?: number;
  createdAt: number;
}

export interface ShoppingListItem {
  id: string; // unique item instance id in list
  masterItemId: string;
  name: string;
  largeCategoryId: string;
  mediumCategoryId: string;
  amount: number;
  unit: string;
  note: string;
  isChecked: boolean;
  addedAt: number;
}

export interface DailyShoppingList {
  date: string; // Format: YYYY-MM-DD
  items: ShoppingListItem[];
  isCompleted?: boolean;
  completedAt?: number;
  updatedAt: number;
}

export type ActiveScreen = 'calendar' | 'creator' | 'shopping' | 'management';
