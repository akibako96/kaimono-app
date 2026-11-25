import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Filter, Trash2, Edit3, ArrowRight, ShoppingBag, 
  CheckCircle2, Layers, AlertCircle, RotateCcw, ChevronDown, ChevronRight
} from 'lucide-react';
import { MasterItem, LargeCategory, MediumCategory, ShoppingListItem, DailyShoppingList } from '../types';
import { PRESET_UNITS } from '../data/defaultPresets';
import { AddToListModal } from './AddToListModal';
import { EditShoppingItemModal } from './EditShoppingItemModal';
import { editShoppingListItem, type ShoppingItemDetails, type ShoppingListGroups } from '../services/shoppingList';

interface ListCreatorViewProps {
  selectedDate: string;
  masterItems: MasterItem[];
  largeCategories: LargeCategory[];
  mediumCategories: MediumCategory[];
  currentShoppingList: DailyShoppingList | null;
  groups: ShoppingListGroups;
  onUpdateShoppingList: (date: string, items: ShoppingListItem[]) => void;
  onOpenAddItemModal: (editingItem?: MasterItem | null) => void;
  onDeleteMasterItem: (id: string) => void;
  onCompleteListCreation: () => void;
}

export const ListCreatorView: React.FC<ListCreatorViewProps> = ({
  selectedDate,
  masterItems,
  largeCategories,
  mediumCategories,
  currentShoppingList,
  groups,
  onUpdateShoppingList,
  onOpenAddItemModal,
  onDeleteMasterItem,
  onCompleteListCreation,
}) => {
  // Filters for left panel
  const [selectedLargeCatFilter, setSelectedLargeCatFilter] = useState<string>('ALL');
  const [selectedMediumCatFilter, setSelectedMediumCatFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals for adding / editing shopping list items
  const [addingMasterItem, setAddingMasterItem] = useState<MasterItem | null>(null);
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingListItem | null>(null);

  // Automatically filter available medium categories based on selected large category
  const availableMediumCategories = useMemo(() => {
    if (selectedLargeCatFilter === 'ALL') {
      return mediumCategories;
    }
    const mediumIdsInLarge = new Set(
      masterItems
        .filter(item => item.largeCategoryId === selectedLargeCatFilter)
        .map(item => item.mediumCategoryId)
    );
    const filtered = mediumCategories.filter(mc => mediumIdsInLarge.has(mc.id));
    return filtered.length > 0 ? filtered : mediumCategories;
  }, [selectedLargeCatFilter, masterItems, mediumCategories]);

  // Handle large category filter change and reset medium category filter if invalid
  const handleLargeCategoryChange = (newLargeCatId: string) => {
    setSelectedLargeCatFilter(newLargeCatId);

    if (newLargeCatId === 'ALL') {
      return;
    }

    const mediumIdsInNewLarge = new Set(
      masterItems
        .filter(item => item.largeCategoryId === newLargeCatId)
        .map(item => item.mediumCategoryId)
    );

    if (selectedMediumCatFilter !== 'ALL' && !mediumIdsInNewLarge.has(selectedMediumCatFilter)) {
      setSelectedMediumCatFilter('ALL');
    }
  };

  // Active list items on right side
  const todayItems: ShoppingListItem[] = currentShoppingList?.items || [];

  // Date formatted
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
  };

  // Filter master items for left panel
  const filteredMasterItems = masterItems.filter(item => {
    if (selectedLargeCatFilter !== 'ALL' && item.largeCategoryId !== selectedLargeCatFilter) {
      return false;
    }
    if (selectedMediumCatFilter !== 'ALL' && item.mediumCategoryId !== selectedMediumCatFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNote = item.note?.toLowerCase().includes(q);
      if (!matchName && !matchNote) return false;
    }
    return true;
  });

  // Category lookup helpers
  const getLargeCatName = (id: string) => largeCategories.find(c => c.id === id)?.name || 'その他';
  const getMediumCatName = (id: string) => mediumCategories.find(c => c.id === id)?.name || 'その他';

  // Add item handler (opens popup)
  const handleOpenAddModal = (masterItem: MasterItem) => {
    setAddingMasterItem(masterItem);
  };

  const handleConfirmAddToList = (amount: number, unit: string, note: string) => {
    if (!addingMasterItem) return;
    const newItem: ShoppingListItem = {
      id: `sli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      masterItemId: addingMasterItem.id,
      name: addingMasterItem.name,
      largeCategoryId: addingMasterItem.largeCategoryId,
      mediumCategoryId: addingMasterItem.mediumCategoryId,
      amount,
      unit,
      note,
      isChecked: false,
      addedAt: Date.now(),
    };

    const updated = [...todayItems, newItem];
    onUpdateShoppingList(selectedDate, updated);
  };

  // Update item handlers for right side
  const handleUpdateItemAmount = (id: string, amount: number) => {
    const updated = todayItems.map(item =>
      item.id === id ? { ...item, amount: Math.max(0.1, amount) } : item
    );
    onUpdateShoppingList(selectedDate, updated);
  };

  const handleUpdateItemUnit = (id: string, unit: string) => {
    const updated = todayItems.map(item => (item.id === id ? { ...item, unit } : item));
    onUpdateShoppingList(selectedDate, updated);
  };

  const handleUpdateItemNote = (id: string, note: string) => {
    const updated = todayItems.map(item => (item.id === id ? { ...item, note } : item));
    onUpdateShoppingList(selectedDate, updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = todayItems.filter(item => item.id !== id);
    onUpdateShoppingList(selectedDate, updated);
  };

  const handleSaveEditedShoppingItem = (id: string, details: ShoppingItemDetails) => {
    onUpdateShoppingList(selectedDate, editShoppingListItem(todayItems, id, details));
  };

  const handleClearAll = () => {
    if (todayItems.length === 0) return;
    if (window.confirm('今日の買い物リストをすべてクリアしますか？')) {
      onUpdateShoppingList(selectedDate, []);
    }
  };

  // Check if a master item is already in today's list
  const getInListCount = (masterItemId: string) => {
    return todayItems.filter(i => i.masterItemId === masterItemId).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 space-y-3">
      {/* Compact Top Info Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-700/50">
            リスト作成
          </span>
          <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5">
            {formatDateDisplay(selectedDate)} の買い物リスト
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-stone-800 border border-stone-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400">選択中:</span>
            <span className="text-sm font-black text-emerald-400">{todayItems.length}</span>
            <span className="text-[11px] text-stone-300">点</span>
          </div>

          <button
            onClick={onCompleteListCreation}
            disabled={todayItems.length === 0}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              todayItems.length === 0
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/20'
            }`}
          >
            リスト作成完了
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* ======================================= */}
        {/* LEFT COLUMN: 全リスト (Master Item List) */}
        {/* ======================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Left Header & Filter Controls */}
          <div className="bg-stone-50 border-b border-stone-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                全アイテムリスト（商品一覧）
              </h3>
              <button
                onClick={() => onOpenAddItemModal(null)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                新規追加
              </button>
            </div>

            {/* Search Input & Reset Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="商品名で検索..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              {(searchQuery || selectedLargeCatFilter !== 'ALL' || selectedMediumCatFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLargeCatFilter('ALL');
                    setSelectedMediumCatFilter('ALL');
                  }}
                  className="px-2.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shrink-0"
                  title="検索・フィルターを解除"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">リセット</span>
                </button>
              )}
            </div>

            {/* Category Filter Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              {/* Large Category Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-0.5">大カテゴリ（場所）</label>
                <select
                  value={selectedLargeCatFilter}
                  onChange={e => handleLargeCategoryChange(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium truncate"
                >
                  <option value="ALL">すべての買う場所</option>
                  {largeCategories.map(lc => (
                    <option key={lc.id} value={lc.id}>
                      {lc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medium Category Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[10px] font-bold text-stone-500">中カテゴリ（分類）</label>
                  {selectedLargeCatFilter !== 'ALL' && (
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded font-bold border border-emerald-200">
                      自動絞り込み中
                    </span>
                  )}
                </div>
                <select
                  value={selectedMediumCatFilter}
                  onChange={e => setSelectedMediumCatFilter(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium truncate"
                >
                  <option value="ALL">
                    {selectedLargeCatFilter === 'ALL'
                      ? 'すべての商品分類'
                      : `絞り込まれた分類 (${availableMediumCategories.length}種類)`}
                  </option>
                  {availableMediumCategories.map(mc => (
                    <option key={mc.id} value={mc.id}>
                      {mc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Master Item List Content */}
          <div className="p-3 flex-1 overflow-y-auto space-y-2 max-h-[550px]">
            {filteredMasterItems.length === 0 ? (
              <div className="text-center py-12 text-stone-400 space-y-2">
                <Search className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs font-medium">該当する商品が見つかりません</p>
                <button
                  onClick={() => onOpenAddItemModal(null)}
                  className="text-xs text-emerald-600 font-bold underline"
                >
                  新しい商品を作成する
                </button>
              </div>
            ) : (
              filteredMasterItems.map(item => {
                const countInList = getInListCount(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 border border-stone-200 hover:border-emerald-300 rounded-xl flex items-center justify-between gap-2 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-stone-800 text-sm truncate">{item.name}</span>
                        {countInList > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-md">
                            選択中 {countInList}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-stone-200/70 rounded text-stone-600 font-medium">
                          {getLargeCatName(item.largeCategoryId)}
                        </span>
                        <span>•</span>
                        <span className="text-stone-500">{getMediumCatName(item.mediumCategoryId)}</span>
                        {item.defaultUnit && (
                          <span className="text-stone-400">({item.defaultAmount}{item.defaultUnit})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenAddItemModal(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
                        title="商品情報を編集"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteMasterItem(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="マスターから削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenAddModal(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 transition-all ml-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        追加
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================= */}
        {/* RIGHT COLUMN: 今日の買い物リスト (Today's List) */}
        {/* ============================================= */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Right Header */}
          <div className="bg-stone-50 border-b border-stone-200 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                今日の買い物リスト（{todayItems.length}件）
              </h3>
              <p className="text-xs text-stone-500">左のリストから選択された商品が入ります</p>
            </div>

            {todayItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-semibold text-stone-500 hover:text-red-600 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                すべてクリア
              </button>
            )}
          </div>

          {/* Today's List Content */}
          <div className="p-4 flex-1 overflow-y-auto space-y-6 max-h-[550px]">
            {todayItems.length === 0 ? (
              <div className="text-center py-20 text-stone-400 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto opacity-30 text-emerald-600" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-stone-600">買い物リストは空です</p>
                  <p className="text-xs text-stone-400">
                    左側の「全アイテムリスト」から買いたい商品を選んで「＋ 追加」を押してください。
                  </p>
                </div>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.key} className="space-y-3">
                  {/* Large Category Header (買う場所) */}
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      【場所】{group.name}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-2xs">
                      {group.totalCount}件
                    </span>
                  </div>

                  {/* Medium Category Subgroups */}
                  <div className="space-y-3 pl-1">
                    {group.mediumGroups.map((mGroup) => (
                      <div key={mGroup.key} className="space-y-2">
                        <div className="text-xs font-bold text-stone-500 border-b border-stone-100 pb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          {mGroup.name}
                        </div>

                        {/* List Items in this Medium Category */}
                        <div className="space-y-2">
                          {mGroup.items.map(item => (
                            <div
                              key={item.id}
                              className="p-3.5 bg-white border border-stone-200 hover:border-emerald-300 rounded-xl shadow-2xs space-y-2.5 transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div
                                  onClick={() => setEditingShoppingItem(item)}
                                  className="cursor-pointer group flex-1 min-w-0"
                                >
                                  <h4 className="font-bold text-stone-900 text-sm sm:text-base group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                    {item.name}
                                    <Edit3 className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-600 inline-block opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </h4>
                                  <p className="text-[11px] text-stone-400 font-medium">
                                    分類: {getMediumCatName(item.mediumCategoryId)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setEditingShoppingItem(item)}
                                    className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="アイテムの詳細編集"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="リストから削除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Quantity & Unit Input Controls */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
                                <span className="text-xs font-bold text-stone-600">数量・個数:</span>
                                <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemAmount(item.id, item.amount - 1)}
                                    className="w-7 h-7 bg-white hover:bg-stone-200 text-stone-800 font-bold rounded-md shadow-2xs border border-stone-200 flex items-center justify-center text-xs"
                                  >
                                    -
                                  </button>

                                  <input
                                    type="number"
                                    min="0.1"
                                    step="any"
                                    value={item.amount}
                                    onChange={e =>
                                      handleUpdateItemAmount(item.id, parseFloat(e.target.value) || 1)
                                    }
                                    className="w-16 text-center text-sm font-black text-stone-900 bg-transparent focus:outline-none"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemAmount(item.id, item.amount + 1)}
                                    className="w-7 h-7 bg-white hover:bg-stone-200 text-stone-800 font-bold rounded-md shadow-2xs border border-stone-200 flex items-center justify-center text-xs"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Unit Selector */}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={item.unit}
                                    onChange={e => handleUpdateItemUnit(item.id, e.target.value)}
                                    placeholder="単位"
                                    className="w-16 text-xs px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>

                                {/* Note input */}
                                <div className="flex-1 min-w-[140px]">
                                  <input
                                    type="text"
                                    value={item.note || ''}
                                    onChange={e => handleUpdateItemNote(item.id, e.target.value)}
                                    placeholder="メモ (例: 特売、メーカー)"
                                    className="w-full text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Complete Button Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">
              合計: <strong className="text-stone-900 font-bold">{todayItems.length}</strong> 点のアイテム
            </span>

            <button
              onClick={onCompleteListCreation}
              disabled={todayItems.length === 0}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all ${
                todayItems.length === 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              リスト作成完了 (買い物モードへ)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add To List Modal */}
      <AddToListModal
        isOpen={Boolean(addingMasterItem)}
        masterItem={addingMasterItem}
        largeCategories={largeCategories}
        mediumCategories={mediumCategories}
        onClose={() => setAddingMasterItem(null)}
        onConfirm={handleConfirmAddToList}
      />

      {/* Edit Shopping Item Modal */}
      <EditShoppingItemModal
        isOpen={Boolean(editingShoppingItem)}
        item={editingShoppingItem}
        largeCategories={largeCategories}
        mediumCategories={mediumCategories}
        onClose={() => setEditingShoppingItem(null)}
        onSave={handleSaveEditedShoppingItem}
        onDelete={handleRemoveItem}
      />
    </div>
  );
};
