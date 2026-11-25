import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Plus, Check } from 'lucide-react';
import { MasterItem, LargeCategory, MediumCategory } from '../types';
import { PRESET_UNITS } from '../data/defaultPresets';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: Partial<MasterItem>, allowDuplicate?: boolean) => void;
  editingItem?: MasterItem | null;
  masterItems: MasterItem[];
  largeCategories: LargeCategory[];
  mediumCategories: MediumCategory[];
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  editingItem,
  masterItems,
  largeCategories,
  mediumCategories,
}) => {
  const [name, setName] = useState('');
  const [largeCategoryId, setLargeCategoryId] = useState('');
  const [mediumCategoryId, setMediumCategoryId] = useState('');
  const [defaultAmount, setDefaultAmount] = useState<number>(1);
  const [defaultUnit, setDefaultUnit] = useState('個');
  const [note, setNote] = useState('');
  
  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Handle large category selection with medium category auto-filter
  const handleLargeCategoryChange = (newLargeId: string) => {
    setLargeCategoryId(newLargeId);

    const mediumIdsInNewLarge = new Set(
      masterItems
        .filter(item => item.largeCategoryId === newLargeId)
        .map(item => item.mediumCategoryId)
    );

    if (mediumIdsInNewLarge.size > 0 && !mediumIdsInNewLarge.has(mediumCategoryId)) {
      const firstMatch = mediumCategories.find(mc => mediumIdsInNewLarge.has(mc.id));
      if (firstMatch) {
        setMediumCategoryId(firstMatch.id);
      }
    }
  };

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setLargeCategoryId(editingItem.largeCategoryId);
      setMediumCategoryId(editingItem.mediumCategoryId);
      setDefaultAmount(editingItem.defaultAmount ?? 1);
      setDefaultUnit(editingItem.defaultUnit ?? '個');
      setNote(editingItem.note ?? '');
    } else {
      setName('');
      setLargeCategoryId(largeCategories[0]?.id || '');
      setMediumCategoryId(mediumCategories[0]?.id || '');
      setDefaultAmount(1);
      setDefaultUnit('個');
      setNote('');
    }
    setDuplicateWarning(null);
  }, [editingItem, isOpen, largeCategories, mediumCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    // Check for duplicate name if creating new or changing name
    if (!editingItem || editingItem.name.trim().toLowerCase() !== trimmedName.toLowerCase()) {
      const isDuplicate = masterItems.some(
        item => item.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (isDuplicate && !duplicateWarning) {
        setDuplicateWarning(`「${trimmedName}」は既に登録されています。同名の商品を追加しますか？`);
        return;
      }
    }

    onSaveItem({
      id: editingItem?.id,
      name: trimmedName,
      largeCategoryId,
      mediumCategoryId,
      defaultAmount: Number(defaultAmount) || 1,
      defaultUnit,
      note: note.trim(),
    });

    onClose();
  };

  const handleConfirmDuplicate = () => {
    onSaveItem({
      id: editingItem?.id,
      name: name.trim(),
      largeCategoryId,
      mediumCategoryId,
      defaultAmount: Number(defaultAmount) || 1,
      defaultUnit,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-full">
        {/* Modal Header */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            {editingItem ? '商品を編集' : '新規商品をマスターに追加'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Duplicate Warning Alert */}
          {duplicateWarning && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl space-y-3">
              <div className="flex items-start gap-2.5 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>重複登録の警告</span>
              </div>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                {duplicateWarning}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmDuplicate}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-2xs"
                >
                  同名でそのまま追加
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-300 transition-colors"
                >
                  名前を変更する
                </button>
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              商品名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (duplicateWarning) setDuplicateWarning(null);
              }}
              placeholder="例: キャベツ、豚肉切り落とし、醤油"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
            />
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Large Category (大カテゴリ: 買う場所) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                大カテゴリ（買う場所）
              </label>
              <select
                value={largeCategoryId}
                onChange={e => handleLargeCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm bg-white font-medium"
              >
                {largeCategories.map(lc => (
                  <option key={lc.id} value={lc.id}>
                    {lc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Medium Category (中カテゴリ: 商品分類) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                中カテゴリ（商品分類）
              </label>
              <select
                value={mediumCategoryId}
                onChange={e => setMediumCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm bg-white font-medium"
              >
                {mediumCategories.map(mc => (
                  <option key={mc.id} value={mc.id}>
                    {mc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Default Amount & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                デフォルトの数量
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={defaultAmount}
                onChange={e => setDefaultAmount(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                単位
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={defaultUnit}
                  onChange={e => setDefaultUnit(e.target.value)}
                  placeholder="例: 個, g, 袋"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Preset Unit Buttons */}
          <div>
            <label className="block text-[11px] text-stone-500 font-medium mb-1">単位のクイック選択:</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_UNITS.slice(0, 8).map(u => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setDefaultUnit(u)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    defaultUnit === u
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              メモ・補足（任意）
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="例: 有機野菜、メーカー指定など"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-sm transition-colors"
            >
              キャンセル
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              {editingItem ? '更新する' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
