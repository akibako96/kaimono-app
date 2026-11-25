import React, { useState } from 'react';
import { X, Copy, Calendar, Check, Share2, Clipboard } from 'lucide-react';
import { DailyShoppingList } from '../types';
import type { ShoppingListGroups } from '../services/shoppingList';

interface CopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  currentShoppingList: DailyShoppingList | null;
  groups: ShoppingListGroups;
  onCopyListToDate: (targetDate: string) => void;
}

export const CopyModal: React.FC<CopyModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  currentShoppingList,
  groups,
  onCopyListToDate,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'date'>('text');
  const [targetDate, setTargetDate] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const items = currentShoppingList?.items || [];

  // Generate clean text representation
  const generateTextList = (): string => {
    if (items.length === 0) return '買い物リストは空です。';

    let text = `【買い物リスト】 ${selectedDate}\n`;
    text += `========================\n`;

    for (const group of groups) {
      text += `\n■ 【${group.name}】\n`;
      for (const { items } of group.mediumGroups) {
        for (const item of items) {
          const noteStr = item.note ? ` (${item.note})` : '';
          const checkMark = item.isChecked ? ' [済]' : ' [ ]';
          text += ` ${checkMark} ${item.name} x ${item.amount}${item.unit}${noteStr}\n`;
        }
      }
    }

    return text;
  };

  const formattedText = generateTextList();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formattedText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleDuplicateToDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) return;
    onCopyListToDate(targetDate);
    alert(`${targetDate} に買い物リストをコピーしました！`);
    onClose();
  };

  return (
    <div className="modal-overlay z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Copy className="w-5 h-5 text-emerald-600" />
            買い物リストのコピー・共有
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/50">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'text'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            テキストとしてコピー
          </button>

          <button
            onClick={() => setActiveTab('date')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'date'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            別の日付にコピー（複製）
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'text' ? (
            <div className="space-y-4">
              <p className="text-xs text-stone-600 font-medium">
                LINEやメモアプリ、家族への送信用にテキスト形式でコピーできます。
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  rows={10}
                  value={formattedText}
                  className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-800 focus:outline-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyToClipboard}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
                  copiedSuccess
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    クリップボードにコピー完了！
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    テキストをクリップボードにコピー
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleDuplicateToDate} className="space-y-4">
              <p className="text-xs text-stone-600 font-medium">
                現在の買い物リスト（{items.length}件）を別のカレンダー日付にそのままコピー複製します。
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  コピー先の日付を選択 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={!targetDate}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
                  !targetDate
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Copy className="w-4 h-4" />
                選択した日付にリストをコピー複製
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
