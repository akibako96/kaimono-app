import React, { useState } from 'react';
import { X, Layers, Plus, ArrowUp, ArrowDown, Trash2, Check, Pencil, RotateCcw } from 'lucide-react';
import { LargeCategory, MediumCategory } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  largeCategories: LargeCategory[];
  mediumCategories: MediumCategory[];
  onSaveLargeCategories: (cats: LargeCategory[]) => void;
  onSaveMediumCategories: (cats: MediumCategory[]) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  largeCategories,
  mediumCategories,
  onSaveLargeCategories,
  onSaveMediumCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'large' | 'medium'>('large');
  const [newCatName, setNewCatName] = useState('');
  
  // State for editing existing category
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (cat: LargeCategory | MediumCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    if (activeTab === 'large') {
      const updated = largeCategories.map(c => c.id === id ? { ...c, name: trimmed } : c);
      onSaveLargeCategories(updated);
    } else {
      const updated = mediumCategories.map(c => c.id === id ? { ...c, name: trimmed } : c);
      onSaveMediumCategories(updated);
    }

    setEditingId(null);
    setEditingName('');
  };

  // Working copy of arrays
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    if (activeTab === 'large') {
      const newCat: LargeCategory = {
        id: `lc_${Date.now()}`,
        name,
        order: largeCategories.length + 1,
      };
      onSaveLargeCategories([...largeCategories, newCat]);
    } else {
      const newCat: MediumCategory = {
        id: `mc_${Date.now()}`,
        name,
        order: mediumCategories.length + 1,
      };
      onSaveMediumCategories([...mediumCategories, newCat]);
    }

    setNewCatName('');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const list = activeTab === 'large' ? [...largeCategories] : [...mediumCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Update order numbers
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));

    if (activeTab === 'large') {
      onSaveLargeCategories(reordered as LargeCategory[]);
    } else {
      onSaveMediumCategories(reordered as MediumCategory[]);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (activeTab === 'large') {
      if (largeCategories.length <= 1) {
        alert('少なくとも1つの大カテゴリが必要です。');
        return;
      }
      if (window.confirm(`「${name}」カテゴリを削除しても宜しいですか？`)) {
        const filtered = largeCategories.filter(c => c.id !== id).map((item, idx) => ({ ...item, order: idx + 1 }));
        onSaveLargeCategories(filtered);
      }
    } else {
      if (mediumCategories.length <= 1) {
        alert('少なくとも1つの中カテゴリが必要です。');
        return;
      }
      if (window.confirm(`「${name}」カテゴリを削除しても宜しいですか？`)) {
        const filtered = mediumCategories.filter(c => c.id !== id).map((item, idx) => ({ ...item, order: idx + 1 }));
        onSaveMediumCategories(filtered);
      }
    }
  };

  const currentList = activeTab === 'large' ? largeCategories : mediumCategories;

  return (
    <div className="modal-overlay z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            カテゴリ管理 (追加・名前変更・削除)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/50">
          <button
            onClick={() => {
              setActiveTab('large');
              handleCancelEdit();
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'large'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            大カテゴリ（買う場所）
          </button>
          <button
            onClick={() => {
              setActiveTab('medium');
              handleCancelEdit();
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'medium'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            中カテゴリ（商品分類）
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              required
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder={
                activeTab === 'large'
                  ? '新しい買う場所 (例: コンビニ, アジアン食材店)'
                  : '新しい分類 (例: パン・シリアル, 冷凍食品)'
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-2xs flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              追加
            </button>
          </form>

          {/* List instructions */}
          <div className="text-xs text-stone-500 flex items-center justify-between font-medium">
            <span>登録済みカテゴリ ({currentList.length}件)</span>
            <span className="text-stone-400">鉛筆で名前変更 / 矢印で順番変更</span>
          </div>

          {/* Reorderable / Editable Category List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {currentList.map((cat, idx) => {
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isEditing
                      ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 mr-2">
                    <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(cat.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                          className="w-full px-2.5 py-1 text-sm bg-white border border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-stone-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shrink-0 transition-colors"
                          title="保存"
                        >
                          <Check className="w-3.5 h-3.5" />
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-300 shrink-0 transition-colors"
                          title="キャンセル"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-stone-800 text-sm truncate">{cat.name}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit Name button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-stone-200 bg-white transition-colors"
                        title="名前を変更"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Up button */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          idx === 0
                            ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                            : 'text-stone-600 border-stone-200 hover:bg-stone-200 hover:text-stone-900 bg-white'
                        }`}
                        title="上へ移動"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Down button */}
                      <button
                        type="button"
                        disabled={idx === currentList.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          idx === currentList.length - 1
                            ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                            : 'text-stone-600 border-stone-200 hover:bg-stone-200 hover:text-stone-900 bg-white'
                        }`}
                        title="下へ移動"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent transition-colors ml-0.5"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-sm shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
