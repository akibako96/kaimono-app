import React from 'react';
import { Calendar, ShoppingBag, CheckSquare, Layers, Settings, RefreshCw, Download, Upload } from 'lucide-react';
import { ActiveScreen } from '../types';

interface HeaderProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  selectedDate: string;
  openCategoryManager: () => void;
  onResetData: () => void;
  onBackupData: () => void;
  onRestoreData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  setActiveScreen,
  selectedDate,
  openCategoryManager,
  onResetData,
  onBackupData,
  onRestoreData,
}) => {
  // Format date for display (e.g. 2026年7月28日)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
  };

  return (
    <header className="app-header bg-emerald-700 text-white shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Brand & App Title */}
          <div className="flex items-center gap-2">
            <div className="bg-white text-emerald-700 p-1.5 rounded-xl shadow-2xs flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none flex items-center gap-1.5">
                買い物リスト
                <span className="text-[10px] font-bold bg-emerald-800/80 text-emerald-200 px-1.5 py-0.5 rounded-md border border-emerald-600/50">
                  v1.2
                </span>
              </h1>
              {selectedDate && (
                <p className="text-[10px] sm:text-xs text-emerald-100 font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  選択日: {formatDateDisplay(selectedDate)}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveScreen('calendar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                activeScreen === 'calendar'
                  ? 'bg-white text-emerald-800 shadow-xs ring-2 ring-white/50'
                  : 'bg-emerald-800/50 hover:bg-emerald-800 text-emerald-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>① 日付</span>
            </button>

            <button
              onClick={() => setActiveScreen('creator')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                activeScreen === 'creator'
                  ? 'bg-white text-emerald-800 shadow-xs ring-2 ring-white/50'
                  : 'bg-emerald-800/50 hover:bg-emerald-800 text-emerald-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>② リスト作成</span>
            </button>

            <button
              onClick={() => setActiveScreen('shopping')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                activeScreen === 'shopping'
                  ? 'bg-white text-emerald-800 shadow-xs ring-2 ring-white/50'
                  : 'bg-emerald-800/50 hover:bg-emerald-800 text-emerald-100'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>③ 買い物</span>
            </button>

            {/* Dedicated Management Mode Tab */}
            <button
              onClick={() => setActiveScreen('management')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                activeScreen === 'management'
                  ? 'bg-amber-300 text-stone-900 shadow-xs ring-2 ring-amber-200'
                  : 'bg-emerald-800/80 hover:bg-emerald-800 text-amber-200 border border-amber-400/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>④ 変更モード</span>
            </button>

            {/* Data Backup Button */}
            <button
              type="button"
              onClick={onBackupData}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-800/80 hover:bg-emerald-900 text-white border border-emerald-400/50 transition-all shadow-2xs"
              title="保存データをJSONファイルに書き出す"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>データをバックアップ</span>
            </button>

            <button
              type="button"
              onClick={onRestoreData}
              className="flex items-center gap-1 rounded-xl border border-emerald-400/50 bg-emerald-800/80 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-900"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>バックアップから復元</span>
            </button>

            {/* Quick Category Manager Modal Button */}
            <button
              onClick={openCategoryManager}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/50 transition-colors hidden md:block"
              title="カテゴリクイック設定"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 transition-colors"
              title="データを初期状態に戻す"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Version Badge Top Right */}
            <span className="text-[11px] font-extrabold text-emerald-200 bg-emerald-800/90 border border-emerald-600/60 px-2 py-0.5 rounded-lg shadow-2xs ml-1">
              v1.2
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
