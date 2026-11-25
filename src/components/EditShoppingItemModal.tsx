import React, { useState, useEffect, useId } from 'react';
import { X, Check, Trash2, Edit3 } from 'lucide-react';
import { ShoppingListItem, LargeCategory, MediumCategory } from '../types';
import { PRESET_UNITS } from '../data/defaultPresets';
import { ShoppingItemDialog } from './ShoppingItemDialog';
import type { ShoppingItemDetails } from '../services/shoppingList';

interface EditShoppingItemModalProps {
  isOpen: boolean;
  item: ShoppingListItem | null;
  largeCategories: LargeCategory[];
  mediumCategories: MediumCategory[];
  onClose: () => void;
  onSave: (id: string, details: ShoppingItemDetails) => void;
  onDelete: (itemId: string) => void;
}

export const EditShoppingItemModal: React.FC<EditShoppingItemModalProps> = ({
  isOpen,
  item,
  largeCategories,
  mediumCategories,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState<string>('');
  const fieldId = useId();
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState<string>('個');
  const [note, setNote] = useState<string>('');
  const [largeCategoryId, setLargeCategoryId] = useState<string>('');
  const [mediumCategoryId, setMediumCategoryId] = useState<string>('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setAmount(String(item.amount));
      setUnit(item.unit);
      setNote(item.note || '');
      setLargeCategoryId(item.largeCategoryId);
      setMediumCategoryId(item.mediumCategoryId);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSave(item.id, {
      name: trimmedName,
      amount: Number(amount) || 1,
      unit: unit.trim() || '個',
      note: note.trim(),
      largeCategoryId,
      mediumCategoryId,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  return (
    <ShoppingItemDialog titleId={`${fieldId}-title`} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-300" />
            <h3 id={`${fieldId}-title`} className="text-base font-black text-white">
              買い物アイテムの編集
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
            {/* Item Name */}
            <div>
              <label htmlFor={`${fieldId}-name`} className="block text-xs font-bold text-stone-700 mb-1">
                商品名
              </label>
              <input
                type="text"
                required
                value={name}
                id={`${fieldId}-name`}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-bold"
              />
            </div>

            {/* Category Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`${fieldId}-large`} className="block text-xs font-bold text-stone-700 mb-1">
                  大カテゴリ (場所)
                </label>
                <select
                  value={largeCategoryId}
                  id={`${fieldId}-large`}
                  onChange={e => setLargeCategoryId(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  {!largeCategories.some(category => category.id === largeCategoryId) && (
                    <option value={largeCategoryId}>その他</option>
                  )}
                  {largeCategories.map(lc => (
                    <option key={lc.id} value={lc.id}>{lc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${fieldId}-medium`} className="block text-xs font-bold text-stone-700 mb-1">
                  中カテゴリ (分類)
                </label>
                <select
                  value={mediumCategoryId}
                  id={`${fieldId}-medium`}
                  onChange={e => setMediumCategoryId(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  {!mediumCategories.some(category => category.id === mediumCategoryId) && (
                    <option value={mediumCategoryId}>その他</option>
                  )}
                  {mediumCategories.map(mc => (
                    <option key={mc.id} value={mc.id}>{mc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount and Unit */}
            <div className="space-y-1.5">
              <label htmlFor={`${fieldId}-amount`} className="block text-xs font-bold text-stone-700">
                数量・個数
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-stone-100 border border-stone-300 rounded-xl p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAmount(prev => String(Math.max(0.1, Number(((Number(prev) || 1) - 1).toFixed(1)))))}
                    className="w-9 h-9 bg-white hover:bg-stone-200 text-stone-800 font-black rounded-lg shadow-2xs border border-stone-200 flex items-center justify-center text-sm active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    id={`${fieldId}-amount`}
                    min="0.1"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-16 text-center text-base font-black text-stone-900 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(prev => String(Number(((Number(prev) || 1) + 1).toFixed(1))))}
                    className="w-9 h-9 bg-white hover:bg-stone-200 text-stone-800 font-black rounded-lg shadow-2xs border border-stone-200 flex items-center justify-center text-sm active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={unit}
                    aria-label="単位"
                    onChange={e => setUnit(e.target.value)}
                    placeholder="単位"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Quick Unit Pills */}
            <div>
              <label className="block text-[11px] text-stone-500 font-medium mb-1">単位のクイック選択:</label>
              <div className="flex flex-wrap gap-1">
                {PRESET_UNITS.slice(0, 10).map(u => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                      unit === u
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Note input */}
            <div>
              <label htmlFor={`${fieldId}-note`} className="block text-xs font-bold text-stone-700 mb-1">
                メモ・補足
              </label>
              <input
                type="text"
                value={note}
                id={`${fieldId}-note`}
                onChange={e => setNote(e.target.value)}
                placeholder="例: 特売、メーカーなど"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
              />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="shrink-0 border-t border-stone-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              削除する
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs transition-colors"
              >
                キャンセル
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                変更を保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </ShoppingItemDialog>
  );
};
