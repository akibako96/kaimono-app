import React, { useState, useMemo } from 'react';
import { 
  Pencil, Trash2, ArrowUp, ArrowDown, Plus, Search, 
  Layers, Package, Check, X, RotateCcw, AlertCircle, Sparkles
} from 'lucide-react';
import { LargeCategory, MediumCategory, MasterItem } from '../types';

interface ManagementViewProps {
  largeCategories: LargeCategory[];
  mediumCategories: MediumCategory[];
  masterItems: MasterItem[];
  onSaveLargeCategories: (cats: LargeCategory[]) => void;
  onSaveMediumCategories: (cats: MediumCategory[]) => void;
  onSaveMasterItems: (items: MasterItem[]) => void;
  onOpenAddItemModal: (itemToEdit?: MasterItem | null) => void;
  onDeleteMasterItem: (id: string) => void;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
  largeCategories,
  mediumCategories,
  masterItems,
  onSaveLargeCategories,
  onSaveMediumCategories,
  onSaveMasterItems,
  onOpenAddItemModal,
  onDeleteMasterItem,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'large' | 'medium'>('items');

  // Filter state for Item tab
  const [selectedLargeCat, setSelectedLargeCat] = useState<string>('ALL');
  const [selectedMediumCat, setSelectedMediumCat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline editing state for Categories & Items
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // New Category Input State
  const [newCatName, setNewCatName] = useState<string>('');

  // Auto-filter medium categories based on selected large category in Item Tab
  const availableMediumCategories = useMemo(() => {
    if (selectedLargeCat === 'ALL') return mediumCategories;
    const mediumIdsInLarge = new Set(
      masterItems
        .filter(i => i.largeCategoryId === selectedLargeCat)
        .map(i => i.mediumCategoryId)
    );
    const filtered = mediumCategories.filter(mc => mediumIdsInLarge.has(mc.id));
    return filtered.length > 0 ? filtered : mediumCategories;
  }, [selectedLargeCat, masterItems, mediumCategories]);

  // Filtered Master Items
  const filteredItems = useMemo(() => {
    return masterItems.filter(item => {
      if (selectedLargeCat !== 'ALL' && item.largeCategoryId !== selectedLargeCat) return false;
      if (selectedMediumCat !== 'ALL' && item.mediumCategoryId !== selectedMediumCat) return false;
      if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [masterItems, selectedLargeCat, selectedMediumCat, searchQuery]);

  // Inline edit handlers
  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveItemName = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    const updated = masterItems.map(item =>
      item.id === id ? { ...item, name: trimmed } : item
    );
    onSaveMasterItems(updated);
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveCategoryName = (id: string, type: 'large' | 'medium') => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    if (type === 'large') {
      const updated = largeCategories.map(c => c.id === id ? { ...c, name: trimmed } : c);
      onSaveLargeCategories(updated);
    } else {
      const updated = mediumCategories.map(c => c.id === id ? { ...c, name: trimmed } : c);
      onSaveMediumCategories(updated);
    }
    setEditingId(null);
    setEditingName('');
  };

  // Reordering handlers for Master Items
  const handleMoveItem = (indexInFiltered: number, direction: 'up' | 'down') => {
    const targetIndexInFiltered = direction === 'up' ? indexInFiltered - 1 : indexInFiltered + 1;
    if (targetIndexInFiltered < 0 || targetIndexInFiltered >= filteredItems.length) return;

    const itemA = filteredItems[indexInFiltered];
    const itemB = filteredItems[targetIndexInFiltered];

    // Swap position in total masterItems list
    const indexA = masterItems.findIndex(i => i.id === itemA.id);
    const indexB = masterItems.findIndex(i => i.id === itemB.id);

    if (indexA !== -1 && indexB !== -1) {
      const newItems = [...masterItems];
      const temp = newItems[indexA];
      newItems[indexA] = newItems[indexB];
      newItems[indexB] = temp;
      onSaveMasterItems(newItems);
    }
  };

  // Reordering handlers for Categories
  const handleMoveCategory = (index: number, direction: 'up' | 'down', type: 'large' | 'medium') => {
    const list = type === 'large' ? [...largeCategories] : [...mediumCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Update order property
    const reordered = list.map((item, i) => ({ ...item, order: i + 1 }));

    if (type === 'large') {
      onSaveLargeCategories(reordered);
    } else {
      onSaveMediumCategories(reordered);
    }
  };

  // Add Category Handler
  const handleAddCategory = (e: React.FormEvent, type: 'large' | 'medium') => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (type === 'large') {
      const newCat: LargeCategory = {
        id: `lc_${Date.now()}`,
        name: trimmed,
        order: largeCategories.length + 1,
      };
      onSaveLargeCategories([...largeCategories, newCat]);
    } else {
      const newCat: MediumCategory = {
        id: `mc_${Date.now()}`,
        name: trimmed,
        order: mediumCategories.length + 1,
      };
      onSaveMediumCategories([...mediumCategories, newCat]);
    }
    setNewCatName('');
  };

  // Delete Category Handler
  const handleDeleteCategory = (id: string, name: string, type: 'large' | 'medium') => {
    if (type === 'large') {
      if (largeCategories.length <= 1) {
        alert('最低1つの大カテゴリが必要です。');
        return;
      }
      if (window.confirm(`「${name}」を削除しますか？`)) {
        const updated = largeCategories.filter(c => c.id !== id);
        onSaveLargeCategories(updated);
      }
    } else {
      if (mediumCategories.length <= 1) {
        alert('最低1つの中カテゴリが必要です。');
        return;
      }
      if (window.confirm(`「${name}」を削除しますか？`)) {
        const updated = mediumCategories.filter(c => c.id !== id);
        onSaveMediumCategories(updated);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 space-y-3">
      {/* Compact Top Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-2.5 sm:p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900 leading-tight">
              マスター変更・設定モード
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">
              カテゴリ名・商品名・表示順序の変更や削除が行えます
            </p>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('items');
              handleCancelEdit();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'items'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            商品マスター ({masterItems.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('large');
              handleCancelEdit();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'large'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            大カテゴリ ({largeCategories.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('medium');
              handleCancelEdit();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'medium'
                ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            中カテゴリ ({mediumCategories.length})
          </button>
        </div>
      </div>

      {/* Main Content Area - Maximized List Area */}
      {activeTab === 'items' && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs p-3 space-y-3">
          {/* Controls Bar: Search & Filter & Add Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="商品名で検索..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Large Category Filter */}
              <select
                value={selectedLargeCat}
                onChange={e => {
                  setSelectedLargeCat(e.target.value);
                  setSelectedMediumCat('ALL');
                }}
                className="text-xs py-1.5 px-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-stone-700"
              >
                <option value="ALL">すべての場所</option>
                {largeCategories.map(lc => (
                  <option key={lc.id} value={lc.id}>{lc.name}</option>
                ))}
              </select>

              {/* Medium Category Filter */}
              <select
                value={selectedMediumCat}
                onChange={e => setSelectedMediumCat(e.target.value)}
                className="text-xs py-1.5 px-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-stone-700"
              >
                <option value="ALL">すべての分類</option>
                {availableMediumCategories.map(mc => (
                  <option key={mc.id} value={mc.id}>{mc.name}</option>
                ))}
              </select>

              {/* Reset Filter Button */}
              {(selectedLargeCat !== 'ALL' || selectedMediumCat !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedLargeCat('ALL');
                    setSelectedMediumCat('ALL');
                    setSearchQuery('');
                  }}
                  className="p-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 rounded-lg flex items-center gap-1 transition-colors"
                  title="絞り込み解除"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">リセット</span>
                </button>
              )}
            </div>

            {/* Add New Master Item Button */}
            <button
              onClick={() => onOpenAddItemModal(null)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              新規商品を登録
            </button>
          </div>

          {/* Master Item List Table / Cards */}
          <div className="space-y-1.5 management-products overflow-y-auto pr-1">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-stone-400 font-medium text-xs">
                該当する商品が見つかりません。
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isEditing = editingId === item.id;
                const largeName = largeCategories.find(lc => lc.id === item.largeCategoryId)?.name || '未分類';
                const mediumName = mediumCategories.find(mc => mc.id === item.mediumCategoryId)?.name || '未分類';

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs'
                        : 'bg-stone-50/80 border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    {/* Item Info & Reorder handle */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                      <span className="w-6 h-6 rounded-lg bg-stone-200 text-stone-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveItemName(item.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            className="w-full px-2.5 py-1 text-xs sm:text-sm bg-white border border-emerald-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-stone-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveItemName(item.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1 bg-stone-200 text-stone-700 rounded-lg text-xs hover:bg-stone-300 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 min-w-0 flex-1">
                          <span className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-200 shrink-0">
                              {largeName}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200 shrink-0">
                              {mediumName}
                            </span>
                            {item.defaultUnit && (
                              <span className="text-stone-400 font-medium">
                                ({item.defaultAmount || 1}{item.defaultUnit})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions: Rename, Reorder, Full Edit Modal, Delete */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick Rename Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item.id, item.name)}
                          className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-stone-200 bg-white transition-colors"
                          title="名前変更"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Full Edit Modal */}
                        <button
                          type="button"
                          onClick={() => onOpenAddItemModal(item)}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 bg-emerald-50 rounded-lg border border-emerald-200 transition-colors hidden sm:block"
                          title="詳細編集"
                        >
                          詳細
                        </button>

                        {/* Order Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            idx === 0
                              ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                              : 'text-stone-600 border-stone-200 hover:bg-stone-200 hover:text-stone-900 bg-white'
                          }`}
                          title="上へ移動"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Order Down */}
                        <button
                          type="button"
                          disabled={idx === filteredItems.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            idx === filteredItems.length - 1
                              ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                              : 'text-stone-600 border-stone-200 hover:bg-stone-200 hover:text-stone-900 bg-white'
                          }`}
                          title="下へ移動"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDeleteMasterItem(item.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-0.5"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Category Tabs (Large or Medium) */}
      {(activeTab === 'large' || activeTab === 'medium') && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs p-3.5 space-y-3">
          {/* Add Category Form */}
          <form
            onSubmit={e => handleAddCategory(e, activeTab)}
            className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200"
          >
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder={
                activeTab === 'large'
                  ? '新しい大カテゴリ名（場所、店舗など）'
                  : '新しい中カテゴリ名（分類など）'
              }
              className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              追加
            </button>
          </form>

          {/* Category List */}
          <div className="space-y-1.5 management-categories overflow-y-auto pr-1">
            {(activeTab === 'large' ? largeCategories : mediumCategories).map((cat, idx, arr) => {
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isEditing
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-200 text-stone-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveCategoryName(cat.id, activeTab);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                          className="w-full px-2.5 py-1 text-xs sm:text-sm bg-white border border-emerald-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-stone-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCategoryName(cat.id, activeTab)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 bg-stone-200 text-stone-700 rounded-lg text-xs hover:bg-stone-300 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                        {cat.name}
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Rename Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat.id, cat.name)}
                        className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-stone-200 bg-white transition-colors"
                        title="名前変更"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Order Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveCategory(idx, 'up', activeTab)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          idx === 0
                            ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                            : 'text-stone-600 border-stone-200 hover:bg-stone-200 hover:text-stone-900 bg-white'
                        }`}
                        title="上へ移動"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Order Down */}
                      <button
                        type="button"
                        disabled={idx === arr.length - 1}
                        onClick={() => handleMoveCategory(idx, 'down', activeTab)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          idx === arr.length - 1
                            ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                            : 'text-stone-600 border-stone-200 hover:bg-stone-200 hover:text-stone-900 bg-white'
                        }`}
                        title="下へ移動"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Category */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name, activeTab)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-0.5"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
