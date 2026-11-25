import React, { useState, useEffect, useId } from 'react';
import { X, Plus } from 'lucide-react';
import { MasterItem, LargeCategory, MediumCategory } from '../types';
import { PRESET_UNITS } from '../data/defaultPresets';
import { ShoppingItemDialog } from './ShoppingItemDialog';

interface AddToListModalProps {
  isOpen: boolean;
  masterItem: MasterItem | null;
  largeCategories: LargeCategory[];
  mediumCategories: MediumCategory[];
  onClose: () => void;
  onConfirm: (amount: number, unit: string, note: string) => void;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({
  isOpen,
  masterItem,
  largeCategories,
  mediumCategories,
  onClose,
  onConfirm,
}) => {
  const fieldId = useId();
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState<string>('個');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (masterItem) {
      setAmount(String(masterItem.defaultAmount ?? 1));
      setUnit(masterItem.defaultUnit ?? '個');
      setNote(masterItem.note ?? '');
    }
  }, [masterItem, isOpen]);

  if (!isOpen || !masterItem) return null;

  const largeCatName = largeCategories.find(c => c.id === masterItem.largeCategoryId)?.name || 'その他';
  const mediumCatName = mediumCategories.find(c => c.id === masterItem.mediumCategoryId)?.name || 'その他';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(Number(amount) || 1, unit.trim() || '個', note.trim());
    onClose();
  };

  return (
    <ShoppingItemDialog titleId={`${fieldId}-title`} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
              買い物リストに追加
            </span>
            <h3 id={`${fieldId}-title`} className="text-lg font-black text-white leading-tight">
              {masterItem.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
            {/* Category badges */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                場所: {largeCatName}
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                分類: {mediumCatName}
              </span>
            </div>

            {/* Amount and Unit */}
            <div className="space-y-1.5">
              <label htmlFor={`${fieldId}-amount`} className="block text-xs font-bold text-stone-700">
                数量・個数 <span className="text-red-500">*</span>
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
                    placeholder="単位 (例: 個, g, 袋)"
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
                メモ・補足（今回の買い物用）
              </label>
              <input
                type="text"
                value={note}
                id={`${fieldId}-note`}
                onChange={e => setNote(e.target.value)}
                placeholder="例: 特売のもの、赤身など"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                ※ マスターのデフォルト値には影響しません
              </p>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="shrink-0 border-t border-stone-200 px-5 py-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs transition-colors"
            >
              キャンセル
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              リストに追加する
            </button>
          </div>
        </form>
      </div>
    </ShoppingItemDialog>
  );
};
