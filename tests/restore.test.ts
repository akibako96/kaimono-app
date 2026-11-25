import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBackupPayload } from '../src/services/backup';
import { parseBackup, prepareRestore, restoreBackup } from '../src/services/restore';
import { STORAGE_KEYS } from '../src/services/storage';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  reject: (key: string, value: string) => boolean = () => false;

  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.reject(key, value)) throw new DOMException('Storage full', 'QuotaExceededError');
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const date = '2026-11-24';
const checkedItem = {
  id: 'sli_test', masterItemId: 'mi_test', name: '白菜', largeCategoryId: 'lc_test',
  mediumCategoryId: 'mc_test', amount: 2, unit: '袋', note: '試験用', addedAt: 1, isChecked: true,
};
const extraKey = 'shopping_app_example';

function backupFixture() {
  const source = new MemoryStorage();
  const categories = JSON.stringify([{ id: 'lc_test', name: '店舗', order: 0 }], null, 3);
  source.setItem(STORAGE_KEYS.LARGE_CATEGORIES, categories);
  source.setItem(STORAGE_KEYS.MASTER_ITEMS, JSON.stringify([{ ...checkedItem, createdAt: 1 }]));
  source.setItem(STORAGE_KEYS.SHOPPING_LISTS, JSON.stringify({
    [date]: { date, items: [checkedItem], updatedAt: 1, completedAt: 2, isCompleted: true },
  }));
  source.setItem(extraKey, 'plain text and trailing whitespace ');
  // The exporter uses the normal browser Storage interface.
  Object.defineProperty(globalThis, 'window', { value: { localStorage: source }, configurable: true });
  try {
    return createBackupPayload(new Date(`${date}T00:00:00Z`));
  } finally {
    Reflect.deleteProperty(globalThis, 'window');
  }
}

test('current export round-trips raw strings, presets, history and checked state', () => {
  const payload = backupFixture();
  const target = new MemoryStorage();
  target.setItem('external_key', 'leave unchanged');
  target.setItem('shopping_app_target_only', 'leave unchanged');
  const plan = prepareRestore(JSON.stringify(payload), target);
  assert.equal(target.getItem(STORAGE_KEYS.SHOPPING_LISTS), null);
  assert.equal(plan.summary.dailyListsCount, 1);
  assert.equal(plan.checkedItems, 1);
  restoreBackup(plan, target);
  for (const [key, value] of Object.entries(payload.rawLocalStorage)) {
    assert.equal(target.getItem(key), value);
  }
  assert.equal(target.getItem(STORAGE_KEYS.MEDIUM_CATEGORIES), JSON.stringify(payload.data[STORAGE_KEYS.MEDIUM_CATEGORIES]));
  assert.equal(target.getItem('external_key'), 'leave unchanged');
  assert.equal(target.getItem('shopping_app_target_only'), 'leave unchanged');
});

test('specified aliases prefer rawStorage over parsed data and storage', () => {
  const { backupFormatVersion, rawLocalStorage, ...metadata } = backupFixture();
  const payload = {
    ...metadata,
    backupVersion: backupFormatVersion,
    rawStorage: rawLocalStorage,
    storage: { [extraKey]: 'lower priority' },
    data: { ...metadata.data, [extraKey]: 'also lower priority' },
  };
  assert.equal(parseBackup(JSON.stringify(payload)).entries.get(extraKey), rawLocalStorage[extraKey]);
});

test('rejects invalid versions, unknown keys and invalid checked state', () => {
  const payload = backupFixture();
  assert.throws(() => parseBackup(JSON.stringify({ ...payload, backupFormatVersion: '2' })));
  assert.throws(() => parseBackup(JSON.stringify({ ...payload, storageKeys: [...payload.storageKeys, 'external'] })));
  assert.throws(() => parseBackup(JSON.stringify({ ...payload, rawLocalStorage: { ...payload.rawLocalStorage, external: '' } })));
  assert.throws(() => parseBackup(JSON.stringify({
    ...payload,
    rawLocalStorage: { ...payload.rawLocalStorage, [STORAGE_KEYS.SHOPPING_LISTS]: JSON.stringify({
      [date]: { date, items: [{ ...checkedItem, isChecked: 'yes' }], updatedAt: 1 },
    }) },
  })));
});

test('rejects a stale preview before writing', () => {
  const target = new MemoryStorage();
  const plan = prepareRestore(JSON.stringify(backupFixture()), target);
  target.setItem(extraKey, 'changed during preview');
  assert.throws(() => restoreBackup(plan, target), /変わりました/);
  assert.equal(target.length, 1);
  assert.equal(target.getItem(extraKey), 'changed during preview');
});

test('quota failure rolls back both overwritten and newly added keys', () => {
  const target = new MemoryStorage();
  const oldValue = '[' + ' '.repeat(100) + ']';
  target.setItem(STORAGE_KEYS.MASTER_ITEMS, oldValue);
  target.setItem(extraKey, 'original');
  // Fail on the largest increase so earlier writes have taken place.
  target.reject = (key) => key === STORAGE_KEYS.MEDIUM_CATEGORIES;
  const plan = prepareRestore(JSON.stringify(backupFixture()), target);
  assert.throws(() => restoreBackup(plan, target), /復元前のデータを保持/);
  assert.equal(target.length, 2);
  assert.equal(target.getItem(STORAGE_KEYS.MASTER_ITEMS), oldValue);
  assert.equal(target.getItem(extraKey), 'original');
  assert.equal(target.getItem(STORAGE_KEYS.LARGE_CATEGORIES), null);
});

test('reports a rollback failure so the recovery file can be saved', () => {
  const target = new MemoryStorage();
  target.setItem(extraKey, 'original');
  const plan = prepareRestore(JSON.stringify(backupFixture()), target);
  target.reject = (key, value) => key === STORAGE_KEYS.MEDIUM_CATEGORIES || (key === extraKey && value === 'original');
  assert.throws(() => restoreBackup(plan, target), /一部の保存値を戻せません/);
});
