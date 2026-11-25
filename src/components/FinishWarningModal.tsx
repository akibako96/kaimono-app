import React from 'react';
import { AlertTriangle, X, CheckCircle2, ArrowRight, CornerDownRight } from 'lucide-react';
import { nextShoppingDate } from '../services/shoppingList';

interface FinishWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  unboughtCount: number;
  selectedDate: string;
  onFinishAnyway: () => void;
  onCarryOverToTomorrow: () => void;
}

export const FinishWarningModal: React.FC<FinishWarningModalProps> = ({
  isOpen,
  onClose,
  unboughtCount,
  selectedDate,
  onFinishAnyway,
  onCarryOverToTomorrow,
}) => {
  if (!isOpen) return null;

  const tomorrowStr = nextShoppingDate(selectedDate);

  return (
    <div className="modal-overlay z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 text-stone-950 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-lg">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            未買い物品がある場合の警告
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-900/60 hover:text-stone-950 hover:bg-amber-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-stone-800">
            <p className="font-bold text-sm text-amber-900">
              まだ購入していない商品が <span className="text-red-600 text-base font-extrabold">{unboughtCount}</span> 件あります！
            </p>
            <p className="text-xs text-stone-600 leading-relaxed">
              買い物をそのまま終了するか、未購入の商品を明日のリスト({tomorrowStr})に繰り越すことができます。
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {/* Carry over to tomorrow button */}
            <button
              onClick={() => {
                onCarryOverToTomorrow();
                onClose();
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-2xs flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                <CornerDownRight className="w-4 h-4" />
                未購入品を翌日 ({tomorrowStr}) に繰り越して終了
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Finish anyway */}
            <button
              onClick={() => {
                onFinishAnyway();
                onClose();
              }}
              className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-sm border border-stone-300 transition-colors flex items-center justify-between"
            >
              <span>未購入品を残したまま終了する</span>
              <CheckCircle2 className="w-4 h-4 text-stone-500" />
            </button>

            {/* Cancel / back to shopping */}
            <button
              onClick={onClose}
              className="w-full py-2.5 text-center text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors"
            >
              買い物に戻る（キャンセル）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
