import React, { useState } from 'react';
import { 
  Eye, EyeOff, Copy, CheckCircle2, ShoppingBag, Store, Sparkles, Plus, Edit3
} from 'lucide-react';
import { ShoppingListItem, LargeCategory, MediumCategory, DailyShoppingList } from '../types';
import { EditShoppingItemModal } from './EditShoppingItemModal';
import { editShoppingListItem, type ShoppingItemDetails, type ShoppingListGroups } from '../services/shoppingList';

interface ShoppingModeViewProps {
  selectedDate: string;
  currentShoppingList: DailyShoppingList | null;
  groups: ShoppingListGroups;
  largeCategories: LargeCategory[];
  mediumCategories: MediumCategory[];
  onToggleCheckItem: (id: string) => void;
  onUpdateShoppingList: (date: string, items: ShoppingListItem[]) => void;
  onNavigateToCreator: () => void;
  onNavigateToCalendar: () => void;
  onOpenFinishWarningModal: (unboughtCount: number) => void;
  onOpenCopyModal: () => void;
  onFinishShoppingSuccess: () => void;
}

export const ShoppingModeView: React.FC<ShoppingModeViewProps> = ({
  selectedDate,
  currentShoppingList,
  groups,
  largeCategories,
  mediumCategories,
  onToggleCheckItem,
  onUpdateShoppingList,
  onNavigateToCreator,
  onNavigateToCalendar,
  onOpenFinishWarningModal,
  onOpenCopyModal,
  onFinishShoppingSuccess,
}) => {
  const [hideChecked, setHideChecked] = useState<boolean>(true);
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingListItem | null>(null);

  const items: ShoppingListItem[] = currentShoppingList?.items || [];
  const totalCount = items.length;
  const checkedCount = items.filter(i => i.isChecked).length;
  const unboughtCount = totalCount - checkedCount;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
  };

  const handleSaveEditedItem = (id: string, details: ShoppingItemDetails) => {
    onUpdateShoppingList(selectedDate, editShoppingListItem(items, id, details));
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = items.filter(i => i.id !== itemId);
    onUpdateShoppingList(selectedDate, updated);
  };

  const handleFinishShoppingClick = () => {
    if (unboughtCount > 0) {
      onOpenFinishWarningModal(unboughtCount);
    } else {
      onFinishShoppingSuccess();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 space-y-3">
      {/* Top Banner Card */}
      <div className="bg-emerald-900 text-white rounded-2xl p-3 sm:p-4 shadow-2xs border border-emerald-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-emerald-300 tracking-wider uppercase flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> 買い物モード
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              {formatDateDisplay(selectedDate)}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy button */}
            <button
              onClick={onOpenCopyModal}
              className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-700/60 flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              コピー
            </button>

            {/* Back to Creator */}
            <button
              onClick={onNavigateToCreator}
              className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs rounded-xl border border-emerald-700/60 flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              編集
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 bg-emerald-950/50 p-4 rounded-2xl border border-emerald-800/80">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
            <span>進捗状況 ({checkedCount} / {totalCount} 件完了)</span>
            <span className="text-emerald-400 font-black text-sm">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Visibility Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={() => setHideChecked(!hideChecked)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              hideChecked
                ? 'bg-amber-400 text-stone-950 shadow-sm font-black'
                : 'bg-emerald-800/80 text-emerald-100 border border-emerald-700'
            }`}
          >
            {hideChecked ? (
              <>
                <EyeOff className="w-4 h-4" />
                購入済みを非表示中 ({checkedCount}件隠す)
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                購入済みを表示中
              </>
            )}
          </button>

          <span className="text-xs text-emerald-300 font-medium">
            ※ □のタップで購入済み。項目をタップで編集できます
          </span>
        </div>
      </div>

      {/* Main Shopping List Body */}
      {totalCount === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-sm space-y-4">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-700">この日の買い物リストは空です</h3>
          <button
            onClick={onNavigateToCreator}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            リストを作成する
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(largeGroup => {
            if (hideChecked && largeGroup.checkedCount === largeGroup.totalCount) {
              return (
                <div
                  key={largeGroup.key}
                  className="bg-stone-100/60 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-500 flex items-center justify-between opacity-75"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    【{largeGroup.name}】全{largeGroup.totalCount}件の購入完了
                  </span>
                  <span className="text-[10px] text-stone-400">（非表示中）</span>
                </div>
              );
            }

            return (
              <div
                key={largeGroup.key}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
              >
                {/* Large Category Header (Store / Buying Location) */}
                <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-400" />
                    【場所】{largeGroup.name}
                  </h3>
                  <span className="text-xs font-bold bg-stone-800 text-stone-200 px-3 py-1 rounded-full border border-stone-700">
                    {largeGroup.checkedCount} / {largeGroup.totalCount} 購入済
                  </span>
                </div>

                {/* Items Grouped by Medium Category */}
                <div className="p-4 space-y-4">
                  {largeGroup.mediumGroups.map((mGroup) => {
                    const mVisibleItems = mGroup.items.filter(i => !hideChecked || !i.isChecked);
                    if (mVisibleItems.length === 0) return null;

                    return (
                      <div key={mGroup.key} className="space-y-2">
                        {/* Medium Category Name */}
                        <div className="text-xs font-bold text-stone-500 border-b border-stone-100 pb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          {mGroup.name}
                        </div>

                        {/* List Items Cards */}
                        <div className="grid grid-cols-1 gap-2">
                          {mVisibleItems.map(item => (
                            <div
                              key={item.id}
                              className={`relative flex items-start gap-0.5 rounded-xl border p-2 transition-all group ${
                                item.isChecked
                                  ? 'bg-stone-100/80 border-stone-200 text-stone-400 opacity-70'
                                  : 'bg-white border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-stone-900 shadow-2xs'
                              }`}
                            >
                              <label
                                className="relative z-10 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg"
                                title={item.isChecked ? '未購入に戻す' : '購入済みにする'}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.isChecked}
                                  onChange={() => onToggleCheckItem(item.id)}
                                  aria-label={`${item.name}の購入状態`}
                                  className="peer sr-only"
                                />
                                <span
                                  aria-hidden="true"
                                  className={`flex size-6 items-center justify-center rounded-lg border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 ${
                                    item.isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {item.isChecked && <CheckCircle2 className="size-5" />}
                                </span>
                              </label>

                              <button
                                type="button"
                                onClick={() => setEditingShoppingItem(item)}
                                aria-label={`${item.name}を編集`}
                                className="min-w-0 flex-1 cursor-pointer py-2 pr-2 text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-emerald-500"
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span className={`flex min-w-0 items-center gap-1.5 text-base sm:text-lg font-bold tracking-tight group-hover:text-emerald-700 ${
                                    item.isChecked ? 'line-through text-stone-400' : 'text-stone-900'
                                  }`}>
                                    <span className="break-all">{item.name}</span>
                                    <Edit3 className="size-4 shrink-0 text-stone-400 opacity-0 group-hover:opacity-100" />
                                  </span>
                                  <span className={`shrink-0 rounded-lg px-3 py-1 text-sm font-black ${
                                    item.isChecked
                                      ? 'bg-stone-200 text-stone-500'
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200/80'
                                  }`}>
                                    {item.amount} {item.unit}
                                  </span>
                                </span>
                                {item.note && (
                                  <span className="mt-1.5 inline-block break-all rounded-md border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                    メモ: {item.note}
                                  </span>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Shopping Item Modal */}
      <EditShoppingItemModal
        isOpen={Boolean(editingShoppingItem)}
        item={editingShoppingItem}
        largeCategories={largeCategories}
        mediumCategories={mediumCategories}
        onClose={() => setEditingShoppingItem(null)}
        onSave={handleSaveEditedItem}
        onDelete={handleDeleteItem}
      />

      {/* Finish Shopping Button Fixed/Sticky Footer */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-20">
        <div className="text-xs font-medium text-stone-600">
          買い物が完了したらボタンを押してください
        </div>

        <button
          onClick={handleFinishShoppingClick}
          className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-base"
        >
          <CheckCircle2 className="w-5 h-5" />
          買い物終了
        </button>
      </div>
    </div>
  );
};
