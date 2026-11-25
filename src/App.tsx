import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Share2, Download, X } from 'lucide-react';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { ListCreatorView } from './components/ListCreatorView';
import { ShoppingModeView } from './components/ShoppingModeView';
import { ManagementView } from './components/ManagementView';
import { ItemModal } from './components/ItemModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { FinishWarningModal } from './components/FinishWarningModal';
import { CopyModal } from './components/CopyModal';
import { RestoreBackupModal } from './components/RestoreBackupModal';
import type { RestorePlan } from './services/restore';
import { groupShoppingList, nextShoppingDate } from './services/shoppingList';

import { 
  ActiveScreen, LargeCategory, MediumCategory, MasterItem, DailyShoppingList, ShoppingListItem 
} from './types';

import {
  getStoredLargeCategories, saveLargeCategories,
  getStoredMediumCategories, saveMediumCategories,
  getStoredMasterItems, saveMasterItems,
  getStoredShoppingLists, saveShoppingListForDate, saveShoppingListsForDates,
  resetAllDataToDefault
} from './services/storage';
import {
  exportAppDataBackup,
  shareBackupFile,
  triggerJsonDownload,
  BackupExportResult,
} from './services/backup';

type BackupNotice =
  | {
      status: 'success';
      result: BackupExportResult;
      shareMessage?: string;
    }
  | {
      status: 'error';
      message: string;
    };

export default function App() {
  // Today's YYYY-MM-DD
  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // State initialization
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());

  const [largeCategories, setLargeCategories] = useState<LargeCategory[]>([]);
  const [mediumCategories, setMediumCategories] = useState<MediumCategory[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [shoppingLists, setShoppingLists] = useState<Record<string, DailyShoppingList>>({});

  const currentShoppingList = shoppingLists[selectedDate] ?? null;
  const shoppingListGroups = useMemo(
    () => groupShoppingList(currentShoppingList?.items ?? [], largeCategories, mediumCategories, masterItems),
    [currentShoppingList, largeCategories, mediumCategories, masterItems],
  );

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<MasterItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFinishWarningOpen, setIsFinishWarningOpen] = useState(false);
  const [unboughtCountForModal, setUnboughtCountForModal] = useState(0);

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [backupNotice, setBackupNotice] = useState<BackupNotice | null>(null);

  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoredMessage, setRestoredMessage] = useState('');

  const loadStoredData = () => {
    setLargeCategories(getStoredLargeCategories());
    setMediumCategories(getStoredMediumCategories());
    setMasterItems(getStoredMasterItems());
    setShoppingLists(getStoredShoppingLists());
  };
  useEffect(loadStoredData, []);

  const handleRestored = (plan: RestorePlan) => {
    loadStoredData();
    setIsRestoreOpen(false);
    setActiveScreen('calendar');
    setRestoredMessage(`カテゴリ・商品マスター・日別リストを復元しました。保存値 ${plan.entries.size}件を照合しました（購入済み商品 ${plan.checkedItems}件）。`);
  };

  // Category Save Handlers
  const handleSaveLargeCategories = (cats: LargeCategory[]) => {
    setLargeCategories(cats);
    saveLargeCategories(cats);
  };

  const handleSaveMediumCategories = (cats: MediumCategory[]) => {
    setMediumCategories(cats);
    saveMediumCategories(cats);
  };

  // Master Item Save & Delete Handlers
  const handleOpenAddItemModal = (itemToEdit: MasterItem | null = null) => {
    setEditingMasterItem(itemToEdit);
    setIsItemModalOpen(true);
  };

  const handleSaveMasterItem = (itemData: Partial<MasterItem>) => {
    let updated: MasterItem[];
    if (itemData.id) {
      // Edit existing
      updated = masterItems.map(item =>
        item.id === itemData.id ? { ...item, ...itemData } as MasterItem : item
      );
    } else {
      // Create new
      const newItem: MasterItem = {
        id: `mi_${Date.now()}`,
        name: itemData.name || '',
        largeCategoryId: itemData.largeCategoryId || largeCategories[0]?.id || 'lc_super',
        mediumCategoryId: itemData.mediumCategoryId || mediumCategories[0]?.id || 'mc_veg',
        defaultAmount: itemData.defaultAmount || 1,
        defaultUnit: itemData.defaultUnit || '個',
        note: itemData.note || '',
        createdAt: Date.now(),
      };
      updated = [newItem, ...masterItems];
    }

    setMasterItems(updated);
    saveMasterItems(updated);
  };

  const handleSaveMasterItems = (items: MasterItem[]) => {
    setMasterItems(items);
    saveMasterItems(items);
  };

  const handleDeleteMasterItem = (id: string) => {
    const item = masterItems.find(i => i.id === id);
    if (!item) return;
    if (window.confirm(`「${item.name}」を全リスト（マスター）から削除しても宜しいですか？`)) {
      const updated = masterItems.filter(i => i.id !== id);
      setMasterItems(updated);
      saveMasterItems(updated);
    }
  };

  // Daily Shopping List Handlers
  const handleUpdateShoppingList = (date: string, items: ShoppingListItem[]) => {
    const existingList = shoppingLists[date] || { date, items: [], updatedAt: Date.now() };
    const newList: DailyShoppingList = {
      ...existingList,
      items,
      updatedAt: Date.now(),
    };

    const updatedAll = saveShoppingListForDate(date, newList);
    setShoppingLists({ ...updatedAll });
  };

  const handleToggleCheckItem = (itemId: string) => {
    const currentList = shoppingLists[selectedDate];
    if (!currentList) return;

    const updatedItems = currentList.items.map(item =>
      item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
    );

    handleUpdateShoppingList(selectedDate, updatedItems);
  };

  // Navigation callbacks
  const handleNavigateToCreator = (date?: string) => {
    if (date) setSelectedDate(date);
    setActiveScreen('creator');
  };

  const handleNavigateToShopping = (date?: string) => {
    if (date) setSelectedDate(date);
    setActiveScreen('shopping');
  };

  // Shopping Finish Actions
  const handleFinishShoppingSuccess = () => {
    const currentList = shoppingLists[selectedDate];
    if (currentList) {
      const updatedList: DailyShoppingList = {
        ...currentList,
        isCompleted: true,
        completedAt: Date.now(),
      };
      saveShoppingListForDate(selectedDate, updatedList);
      setShoppingLists(getStoredShoppingLists());
    }

    alert('お買い物お疲れ様でした！すべての商品を購入完了しました。');
    setActiveScreen('calendar');
  };

  const handleCarryOverToTomorrow = () => {
    const currentList = shoppingLists[selectedDate];
    if (!currentList) return;

    const unboughtItems = currentList.items.filter(i => !i.isChecked);
    if (unboughtItems.length === 0) return;

    const tomorrowStr = nextShoppingDate(selectedDate);

    // Get or initialize tomorrow's list
    const tomorrowList = shoppingLists[tomorrowStr] || { date: tomorrowStr, items: [], updatedAt: Date.now() };
    
    // Convert unbought items into new instances for tomorrow
    const carriedOverItems: ShoppingListItem[] = unboughtItems.map(item => ({
      ...item,
      id: `sli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isChecked: false,
      addedAt: Date.now(),
    }));

    const now = Date.now();
    try {
      const updated = saveShoppingListsForDates(
        {
          ...tomorrowList,
          items: [...tomorrowList.items, ...carriedOverItems],
          updatedAt: now,
        },
        {
          ...currentList,
          items: currentList.items.filter(i => i.isChecked),
          isCompleted: true,
          completedAt: now,
          updatedAt: now,
        },
      );
      setShoppingLists(updated);
    } catch {
      alert('翌日に繰り越せませんでした。元のリストを保存しています。');
      return;
    }
    alert(`未購入品 ${unboughtItems.length} 件を ${tomorrowStr} に繰り越しました。`);
    setActiveScreen('calendar');
  };

  const handleCopyListToDate = (targetDate: string) => {
    const currentList = shoppingLists[selectedDate];
    if (!currentList || currentList.items.length === 0) return;

    const targetExisting = shoppingLists[targetDate] || { date: targetDate, items: [], updatedAt: Date.now() };

    const copiedItems: ShoppingListItem[] = currentList.items.map(item => ({
      ...item,
      id: `sli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isChecked: false,
      addedAt: Date.now(),
    }));

    saveShoppingListForDate(targetDate, {
      ...targetExisting,
      items: [...targetExisting.items, ...copiedItems],
      updatedAt: Date.now(),
    });

    setShoppingLists(getStoredShoppingLists());
  };

  const handleResetData = () => {
    if (window.confirm('カテゴリ、商品マスター、買い物履歴のすべてのデータを初期状態に戻しますか？')) {
      resetAllDataToDefault();
      setLargeCategories(getStoredLargeCategories());
      setMediumCategories(getStoredMediumCategories());
      setMasterItems(getStoredMasterItems());
      setShoppingLists({});
      alert('データを初期状態にリセットしました。');
    }
  };

  const handleBackupData = () => {
    try {
      const result = exportAppDataBackup();
      setBackupNotice({
        status: 'success',
        result,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'バックアップファイルの作成中に予期しないエラーが発生しました。';
      setBackupNotice({
        status: 'error',
        message,
      });
    }
  };

  const handleShareBackup = async () => {
    if (!backupNotice || backupNotice.status !== 'success') return;
    try {
      const outcome = await shareBackupFile(
        backupNotice.result.jsonString,
        backupNotice.result.fileName
      );
      if (outcome === 'shared') {
        setBackupNotice({
          ...backupNotice,
          shareMessage: '共有メニューからファイルの保存・共有を完了しました。',
        });
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '共有メニューでの保存に失敗しました。再ダウンロードをお試しください。';
      setBackupNotice({
        status: 'error',
        message,
      });
    }
  };

  const handleRedownloadBackup = () => {
    if (!backupNotice || backupNotice.status !== 'success') return;
    try {
      triggerJsonDownload(backupNotice.result.jsonString, backupNotice.result.fileName);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '再ダウンロードに失敗しました。';
      setBackupNotice({
        status: 'error',
        message,
      });
    }
  };

  return (
    <div className="app-frame bg-stone-100 text-stone-900 font-sans antialiased flex flex-col">
      {/* Navigation Header */}
      <Header
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        selectedDate={selectedDate}
        openCategoryManager={() => setIsCategoryModalOpen(true)}
        onResetData={handleResetData}
        onBackupData={handleBackupData}
        onRestoreData={() => {
          setRestoredMessage('');
          setIsRestoreOpen(true);
        }}
      />

      {restoredMessage && (
        <div role="status" className="mx-2 mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          {restoredMessage}
        </div>
      )}
      {isRestoreOpen && <RestoreBackupModal onClose={() => setIsRestoreOpen(false)} onRestored={handleRestored} />}

      {/* Backup Export Status Banner */}
      {backupNotice && (
        <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 pt-3">
          {backupNotice.status === 'success' ? (
            <div
              role="status"
              aria-live="polite"
              className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-emerald-900">
                    バックアップを書き出しました
                  </p>
                  <p className="text-xs font-semibold text-emerald-800 break-all">
                    ファイル名: {backupNotice.result.fileName}（形式 v{backupNotice.result.payload.backupFormatVersion} / {backupNotice.result.payload.createdAtLocal}）
                  </p>
                  <p className="text-xs text-emerald-800/90">
                    大カテゴリ {backupNotice.result.payload.summary.largeCategoriesCount}件 / 中カテゴリ {backupNotice.result.payload.summary.mediumCategoriesCount}件 / 商品マスター {backupNotice.result.payload.summary.masterItemsCount}件 / 日別リスト {backupNotice.result.payload.summary.dailyListsCount}日分（計{backupNotice.result.payload.summary.totalShoppingItemsCount}品目）
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    iPhoneのSafariでは「ダウンロード」を選ぶと「ファイル」アプリに保存されます。元の保存データは変更されていません。
                  </p>
                  {backupNotice.shareMessage && (
                    <p className="text-xs font-bold text-emerald-700">
                      {backupNotice.shareMessage}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {backupNotice.result.canShareFile && (
                      <button
                        type="button"
                        onClick={handleShareBackup}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        共有メニューで保存（ファイルアプリ等）
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRedownloadBackup}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      もう一度ダウンロード
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBackupNotice(null)}
                className="p-1 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 transition-colors shrink-0"
                aria-label="閉じる"
                title="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              role="alert"
              className="bg-red-50 border border-red-300 text-red-950 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-red-900">
                    バックアップの書き出しに失敗しました
                  </p>
                  <p className="text-xs text-red-800 break-words">
                    {backupNotice.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBackupNotice(null)}
                className="p-1 rounded-lg text-red-700 hover:text-red-950 hover:bg-red-100 transition-colors shrink-0"
                aria-label="閉じる"
                title="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {activeScreen === 'calendar' && (
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            shoppingLists={shoppingLists}
            groups={shoppingListGroups}
            onNavigateToCreator={handleNavigateToCreator}
            onNavigateToShopping={handleNavigateToShopping}
          />
        )}

        {activeScreen === 'creator' && (
          <ListCreatorView
            selectedDate={selectedDate}
            masterItems={masterItems}
            largeCategories={largeCategories}
            mediumCategories={mediumCategories}
            currentShoppingList={currentShoppingList}
            groups={shoppingListGroups}
            onUpdateShoppingList={handleUpdateShoppingList}
            onOpenAddItemModal={handleOpenAddItemModal}
            onDeleteMasterItem={handleDeleteMasterItem}
            onCompleteListCreation={() => setActiveScreen('shopping')}
          />
        )}

        {activeScreen === 'shopping' && (
          <ShoppingModeView
            selectedDate={selectedDate}
            currentShoppingList={currentShoppingList}
            groups={shoppingListGroups}
            largeCategories={largeCategories}
            mediumCategories={mediumCategories}
            onToggleCheckItem={handleToggleCheckItem}
            onUpdateShoppingList={handleUpdateShoppingList}
            onNavigateToCreator={() => setActiveScreen('creator')}
            onNavigateToCalendar={() => setActiveScreen('calendar')}
            onOpenFinishWarningModal={(unboughtCount) => {
              setUnboughtCountForModal(unboughtCount);
              setIsFinishWarningOpen(true);
            }}
            onOpenCopyModal={() => setIsCopyModalOpen(true)}
            onFinishShoppingSuccess={handleFinishShoppingSuccess}
          />
        )}

        {activeScreen === 'management' && (
          <ManagementView
            largeCategories={largeCategories}
            mediumCategories={mediumCategories}
            masterItems={masterItems}
            onSaveLargeCategories={handleSaveLargeCategories}
            onSaveMediumCategories={handleSaveMediumCategories}
            onSaveMasterItems={handleSaveMasterItems}
            onOpenAddItemModal={handleOpenAddItemModal}
            onDeleteMasterItem={handleDeleteMasterItem}
          />
        )}
      </main>

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSaveItem={handleSaveMasterItem}
        editingItem={editingMasterItem}
        masterItems={masterItems}
        largeCategories={largeCategories}
        mediumCategories={mediumCategories}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        largeCategories={largeCategories}
        mediumCategories={mediumCategories}
        onSaveLargeCategories={handleSaveLargeCategories}
        onSaveMediumCategories={handleSaveMediumCategories}
      />

      <FinishWarningModal
        isOpen={isFinishWarningOpen}
        onClose={() => setIsFinishWarningOpen(false)}
        unboughtCount={unboughtCountForModal}
        selectedDate={selectedDate}
        onFinishAnyway={() => {
          setIsFinishWarningOpen(false);
          alert('買い物を終了しました。');
          setActiveScreen('calendar');
        }}
        onCarryOverToTomorrow={handleCarryOverToTomorrow}
      />

      <CopyModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        selectedDate={selectedDate}
        currentShoppingList={currentShoppingList}
        groups={shoppingListGroups}
        onCopyListToDate={handleCopyListToDate}
      />
    </div>
  );
}
