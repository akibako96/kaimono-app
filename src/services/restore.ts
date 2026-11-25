import { BACKUP_FORMAT_VERSION, summarizeBackupData } from './backup';
import { APP_STORAGE_KEY_PREFIX, STORAGE_KEYS } from './storage';

export const MAX_BACKUP_BYTES = 32 * 1024 * 1024;

type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isText = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

function fields(
  value: unknown,
  required: Record<string, (field: unknown) => boolean>,
  optional: Record<string, (field: unknown) => boolean> = {},
): boolean {
  return isRecord(value)
    && Object.entries(required).every(([name, valid]) => valid(value[name]))
    && Object.entries(optional).every(([name, valid]) => value[name] === undefined || valid(value[name]));
}

const category = (value: unknown) => fields(value, { id: isText, name: isText, order: isNumber });
const itemFields = { id: isText, name: isText, largeCategoryId: isText, mediumCategoryId: isText };
const masterItem = (value: unknown) => fields(value, { ...itemFields, createdAt: isNumber }, {
  defaultUnit: isText, defaultAmount: isNumber, note: isText, order: isNumber,
});
const shoppingItem = (value: unknown) => fields(value, {
  ...itemFields, masterItemId: isText, amount: isNumber, unit: isText, note: isText,
  isChecked: isBoolean, addedAt: isNumber,
});

function isDailyList(date: string, list: unknown): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(date);
  return Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date
    && fields(list, {
      date: (value) => value === date,
      items: (value) => Array.isArray(value) && value.every(shoppingItem),
      updatedAt: isNumber,
    }, { isCompleted: isBoolean, completedAt: isNumber });
}

const coreValidators: Record<string, (value: unknown) => boolean> = {
  [STORAGE_KEYS.LARGE_CATEGORIES]: (value) => Array.isArray(value) && value.length > 0 && value.every(category),
  [STORAGE_KEYS.MEDIUM_CATEGORIES]: (value) => Array.isArray(value) && value.length > 0 && value.every(category),
  [STORAGE_KEYS.MASTER_ITEMS]: (value) => Array.isArray(value) && value.every(masterItem),
  [STORAGE_KEYS.SHOPPING_LISTS]: (value) => isRecord(value) && Object.entries(value).every(([date, list]) => isDailyList(date, list)),
};

export function parseBackup(json: string) {
  let payload: unknown;
  try {
    payload = JSON.parse(json.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('JSONファイルを読み取れませんでした。');
  }

  if (!isRecord(payload)) throw new Error('バックアップの形式が正しくありません。');
  const { appName, appVersion, createdAt, createdAtLocal, storageKeys } = payload;
  const version = String(payload.backupFormatVersion ?? payload.backupVersion ?? '');
  if (![BACKUP_FORMAT_VERSION, '1'].includes(version)
    || !isText(appName) || !appName.trim() || !isText(appVersion)
    || !isText(createdAt) || !Number.isFinite(Date.parse(createdAt))
    || !Array.isArray(storageKeys)
    || !storageKeys.every((key) => isText(key) && key.startsWith(APP_STORAGE_KEY_PREFIX))
    || new Set(storageKeys).size !== storageKeys.length
    || !Object.keys(coreValidators).every((key) => storageKeys.includes(key))) {
    throw new Error('対応するバックアップ形式を選んでください。保存キーまたはファイル情報が正しくありません。');
  }

  const rawStorage = payload.rawStorage ?? payload.rawLocalStorage ?? {};
  const storage = payload.storage ?? {};
  const data = payload.data ?? {};
  if (![rawStorage, storage, data].every((record) =>
    isRecord(record) && Object.keys(record).every((key) => storageKeys.includes(key)))
    || !isRecord(rawStorage) || !isRecord(storage) || !isRecord(data)
    || !Object.values(rawStorage).every(isText)) {
    throw new Error('バックアップの保存データが正しくありません。');
  }

  const entries = new Map<string, string>();
  const validatedData: RecordValue = {};
  for (const key of storageKeys as string[]) {
    const stored = storage[key];
    const raw = rawStorage[key] ?? (isText(stored) ? stored : undefined);
    let parsed: unknown = data[key] ?? stored;
    if (raw !== undefined && Object.hasOwn(coreValidators, key)) {
      try {
        parsed = JSON.parse(raw as string);
      } catch {
        throw new Error(`${key} の保存文字列が正しいJSONではありません。`);
      }
    }
    if (Object.hasOwn(coreValidators, key) && !coreValidators[key](parsed)) {
      throw new Error(`${key} のデータ構造が正しくありません。`);
    }
    if (raw === undefined && !Object.hasOwn(data, key) && !Object.hasOwn(storage, key)) {
      throw new Error(`${key} の保存値が見つかりません。`);
    }
    entries.set(key, (raw as string | undefined) ?? JSON.stringify(parsed ?? null));
    validatedData[key] = parsed;
  }

  const dailyLists = validatedData[STORAGE_KEYS.SHOPPING_LISTS] as Record<string, { items: { isChecked: boolean }[] }>;
  return {
    entries,
    createdAt: isText(createdAtLocal) && createdAtLocal.trim() ? createdAtLocal : createdAt,
    summary: summarizeBackupData(validatedData, entries.size),
    checkedItems: Object.values(dailyLists).reduce(
      (count, list) => count + list.items.filter((item) => item.isChecked).length, 0,
    ),
  };
}

export function prepareRestore(json: string, storage: StorageAccess) {
  const backup = parseBackup(json);
  return {
    ...backup,
    previous: new Map(Array.from(backup.entries.keys(), (key) => [key, storage.getItem(key)])),
  };
}

export type RestorePlan = ReturnType<typeof prepareRestore>;

export function restoreBackup(plan: RestorePlan, storage: StorageAccess) {
  for (const [key, before] of plan.previous) {
    if (storage.getItem(key) !== before) {
      throw new Error('確認中に保存データが変わりました。ファイルを選び直してください。');
    }
  }

  // Release space before growing other entries. Reverse this order on failure.
  const changes = [...plan.entries].filter(([key, after]) => plan.previous.get(key) !== after);
  const sizeChange = ([key, after]: [string, string]) =>
    after.length - (plan.previous.get(key)?.length ?? -key.length);
  changes.sort((a, b) => sizeChange(a) - sizeChange(b));

  const written: string[] = [];
  try {
    for (const [key, value] of changes) {
      storage.setItem(key, value);
      written.push(key);
    }
    // Read back each string, including unchanged keys. This verifies every field and purchase check.
    for (const [key, value] of plan.entries) {
      if (storage.getItem(key) !== value) throw new Error('保存値が一致しません。');
    }
  } catch {
    const rollbackFailed = written.reverse().filter((key) => {
      try {
        const value = plan.previous.get(key) ?? null;
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
        return storage.getItem(key) !== value;
      } catch {
        return true;
      }
    });
    if (rollbackFailed.length) {
      throw new Error('復元に失敗し、一部の保存値を戻せませんでした。この画面で復元前のバックアップを保存してください。');
    }
    throw new Error('復元できませんでした。空き容量や保存設定を確認してください。復元前のデータを保持しています。');
  }
}
