import { LargeCategory, MediumCategory, MasterItem } from '../types';

export const DEFAULT_LARGE_CATEGORIES: LargeCategory[] = [
  { id: 'lc_super', name: 'スーパー', order: 1 },
  { id: 'lc_drug', name: 'ドラッグストア', order: 2 },
  { id: 'lc_100yen', name: '100円ショップ', order: 3 },
  { id: 'lc_home', name: 'ホームセンター', order: 4 },
  { id: 'lc_other', name: 'その他', order: 5 },
];

export const DEFAULT_MEDIUM_CATEGORIES: MediumCategory[] = [
  { id: 'mc_veg', name: '野菜', order: 1 },
  { id: 'mc_fruit', name: '果物', order: 2 },
  { id: 'mc_meat_fish', name: '精肉・鮮魚', order: 3 },
  { id: 'mc_dairy', name: 'デイリー・乳製品', order: 4 },
  { id: 'mc_seasoning', name: '調味料', order: 5 },
  { id: 'mc_spice', name: '香辛料', order: 6 },
  { id: 'mc_dry', name: '乾物・缶詰', order: 7 },
  { id: 'mc_frozen', name: '冷凍・加工食品', order: 8 },
  { id: 'mc_snack_drink', name: 'お菓子・飲料', order: 9 },
  { id: 'mc_daily', name: '日用品', order: 10 },
  { id: 'mc_other', name: 'その他', order: 11 },
];

export const DEFAULT_MASTER_ITEMS: MasterItem[] = [
  // 野菜
  { id: 'mi_cabbage', name: 'キャベツ', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_veg', defaultAmount: 1, defaultUnit: '玉', createdAt: 1 },
  { id: 'mi_onion', name: 'たまねぎ', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_veg', defaultAmount: 1, defaultUnit: '袋', createdAt: 2 },
  { id: 'mi_carrot', name: 'にんじん', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_veg', defaultAmount: 1, defaultUnit: '袋', createdAt: 3 },
  { id: 'mi_potato', name: 'じゃがいも', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_veg', defaultAmount: 1, defaultUnit: '袋', createdAt: 4 },
  { id: 'mi_lettuce', name: 'レタス', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_veg', defaultAmount: 1, defaultUnit: '個', createdAt: 5 },
  { id: 'mi_tomato', name: 'トマト', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_veg', defaultAmount: 1, defaultUnit: 'パック', createdAt: 6 },

  // 果物
  { id: 'mi_apple', name: 'りんご', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_fruit', defaultAmount: 1, defaultUnit: '袋', createdAt: 7 },
  { id: 'mi_banana', name: 'バナナ', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_fruit', defaultAmount: 1, defaultUnit: '房', createdAt: 8 },

  // 精肉・鮮魚
  { id: 'mi_pork', name: '豚肉切り落とし', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_meat_fish', defaultAmount: 300, defaultUnit: 'g', createdAt: 9 },
  { id: 'mi_chicken', name: '鶏もも肉', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_meat_fish', defaultAmount: 2, defaultUnit: '枚', createdAt: 10 },
  { id: 'mi_salmon', name: '鮭の切り身', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_meat_fish', defaultAmount: 2, defaultUnit: '切れ', createdAt: 11 },

  // デイリー・乳製品
  { id: 'mi_milk', name: '牛乳', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_dairy', defaultAmount: 1, defaultUnit: '本', createdAt: 12 },
  { id: 'mi_egg', name: '卵', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_dairy', defaultAmount: 1, defaultUnit: 'パック', createdAt: 13 },
  { id: 'mi_tofu', name: '豆腐', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_dairy', defaultAmount: 1, defaultUnit: 'パック', createdAt: 14 },
  { id: 'mi_natto', name: '納豆', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_dairy', defaultAmount: 1, defaultUnit: 'パック', createdAt: 15 },

  // 調味料
  { id: 'mi_soysauce', name: '醤油', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_seasoning', defaultAmount: 1, defaultUnit: '本', createdAt: 16 },
  { id: 'mi_mirin', name: 'みりん', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_seasoning', defaultAmount: 1, defaultUnit: '本', createdAt: 17 },
  { id: 'mi_miso', name: '味噌', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_seasoning', defaultAmount: 1, defaultUnit: '個', createdAt: 18 },
  { id: 'mi_mayo', name: 'マヨネーズ', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_seasoning', defaultAmount: 1, defaultUnit: '本', createdAt: 19 },

  // 香辛料
  { id: 'mi_pepper', name: '塩胡椒', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_spice', defaultAmount: 1, defaultUnit: '個', createdAt: 20 },
  { id: 'mi_wasabi', name: 'チューブわさび', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_spice', defaultAmount: 1, defaultUnit: '本', createdAt: 21 },

  // 乾物・缶詰
  { id: 'mi_tuna', name: 'ツナ缶', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_dry', defaultAmount: 1, defaultUnit: 'パック', createdAt: 22 },
  { id: 'mi_wakame', name: '乾燥わかめ', largeCategoryId: 'lc_super', mediumCategoryId: 'mc_dry', defaultAmount: 1, defaultUnit: '袋', createdAt: 23 },

  // 日用品
  { id: 'mi_tissue', name: 'ティッシュペーパー', largeCategoryId: 'lc_drug', mediumCategoryId: 'mc_daily', defaultAmount: 1, defaultUnit: 'パック', createdAt: 24 },
  { id: 'mi_toilet', name: 'トイレットペーパー', largeCategoryId: 'lc_drug', mediumCategoryId: 'mc_daily', defaultAmount: 1, defaultUnit: 'パック', createdAt: 25 },
  { id: 'mi_dishwash', name: '食器用洗剤', largeCategoryId: 'lc_drug', mediumCategoryId: 'mc_daily', defaultAmount: 1, defaultUnit: '本', createdAt: 26 },
];

export const PRESET_UNITS = ['個', 'g', 'kg', 'パック', '袋', '本', '束', '枚', '切れ', '箱', 'ケース', '玉', '房'];
