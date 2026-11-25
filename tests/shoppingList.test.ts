import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editShoppingListItem, groupShoppingList, nextShoppingDate } from '../src/services/shoppingList';
import { saveShoppingListsForDates, STORAGE_KEYS } from '../src/services/storage';
import type { DailyShoppingList, MasterItem, ShoppingListItem } from '../src/types';

const masterItems: MasterItem[] = ['z', 'a'].map(id => ({
  id, name: id, createdAt: 1, largeCategoryId: 'store', mediumCategoryId: 'vegetables',
}));
const large = [{ id: 'store', name: 'スーパー', order: 1 }, { id: 'drugstore', name: '薬局', order: 2 }];
const medium = [{ id: 'daily', name: '日用品', order: 2 }, { id: 'vegetables', name: '野菜', order: 1 }];

function item(id: string, masterItemId: string, largeCategoryId = 'store', mediumCategoryId = 'vegetables'): ShoppingListItem {
  return { id, masterItemId, name: id, largeCategoryId, mediumCategoryId, amount: 1, unit: '個', note: '', isChecked: false, addedAt: 1 };
}

const ids = (groups: ReturnType<typeof groupShoppingList>) => groups.flatMap(
  group => group.mediumGroups.flatMap(medium => medium.items.map(entry => entry.id)),
);

test('configured group and master order applies to display without writing or changing the items', () => {
  const input = [
    item('orphan-both', 'deleted', 'old-store', 'old-section'),
    item('daily', 'sold', 'store', 'daily'),
    item('a', 'a'),
    item('orphan', 'deleted'),
    { ...item('z', 'z'), isChecked: true },
    item('a-second', 'a'),
    item('drugstore', 'sold', 'drugstore', 'daily'),
    item('old-section', 'sold', 'store', 'old-section'),
    item('old-store', 'sold', 'old-store', 'vegetables'),
  ];
  const original = JSON.stringify(input);
  const groups = groupShoppingList(input, large, medium, masterItems);
  assert.deepEqual(ids(groups), ['z', 'orphan', 'a', 'a-second', 'daily', 'old-section', 'drugstore', 'old-store', 'orphan-both']);
  assert.equal(groups[0].checkedCount, 1);
  assert.equal(JSON.stringify(input), original);

  const reorderedLarge = large.map(category => ({ ...category, order: -category.order }));
  const reorderedMedium = medium.map(category => ({ ...category, order: -category.order }));
  assert.deepEqual(ids(groupShoppingList(input, reorderedLarge, reorderedMedium, [...masterItems].reverse())),
    ['drugstore', 'daily', 'a', 'orphan', 'a-second', 'z', 'old-section', 'old-store', 'orphan-both']);
});

test('edit replaces details on one daily item and preserves identity, purchase state and other instances', () => {
  const first = { ...item('instance1', 'a'), isChecked: true };
  const second = item('instance2', 'a');
  const originalMaster = JSON.stringify(masterItems);
  const [updated, unchanged] = editShoppingListItem([first, second], first.id, {
    name: 'さつまいも', amount: 2, unit: '袋', note: 'テスト', largeCategoryId: 'store', mediumCategoryId: 'vegetables',
  });
  assert.equal(updated.name, 'さつまいも');
  assert.equal(updated.isChecked, true);
  assert.equal(updated.masterItemId, first.masterItemId);
  assert.equal(updated.addedAt, first.addedAt);
  assert.equal(updated.id, first.id);
  assert.equal(first.name, 'instance1');
  assert.equal(unchanged, second);
  assert.equal(JSON.stringify(masterItems), originalMaster);
});

test('next shopping date uses calendar arithmetic, including month and year boundaries', () => {
  assert.equal(nextShoppingDate('2024-02-29'), '2024-03-01');
  assert.equal(nextShoppingDate('2025-12-31'), '2026-01-01');
});

test('carry-over can update both dates together and preserve both on storage failure', () => {
  const today: DailyShoppingList = { date: '2026-01-01', items: [item('first', 'a')], updatedAt: 1 };
  const tomorrow: DailyShoppingList = { date: '2026-01-02', items: [item('second', 'z')], updatedAt: 1 };
  let raw = JSON.stringify({ [today.date]: today, [tomorrow.date]: tomorrow });
  const original = raw;
  let writes = 0;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => raw,
      setItem: (key: string, value: string) => {
        assert.equal(key, STORAGE_KEYS.SHOPPING_LISTS);
        writes++;
        if (writes === 1) throw new DOMException('Storage full', 'QuotaExceededError');
        raw = value;
      },
    },
  });
  try {
    const carriedToday = { ...today, items: [], isCompleted: true };
    const carriedTomorrow = { ...tomorrow, items: [...tomorrow.items, ...today.items] };
    assert.throws(() => saveShoppingListsForDates(carriedToday, carriedTomorrow), /Storage full/);
    assert.equal(raw, original);
    const saved = saveShoppingListsForDates(carriedToday, carriedTomorrow);
    assert.deepEqual(JSON.parse(raw), saved);
    assert.deepEqual(saved[today.date], carriedToday);
    assert.deepEqual(saved[tomorrow.date], carriedTomorrow);
    assert.equal(writes, 2);
  } finally {
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
