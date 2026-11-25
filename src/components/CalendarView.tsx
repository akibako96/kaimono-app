import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, ShoppingBag, CheckCircle2, AlertCircle, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { DailyShoppingList } from '../types';
import type { ShoppingListGroups } from '../services/shoppingList';

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  shoppingLists: Record<string, DailyShoppingList>;
  groups: ShoppingListGroups;
  onNavigateToCreator: (date: string) => void;
  onNavigateToShopping: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  shoppingLists,
  groups,
  onNavigateToCreator,
  onNavigateToShopping,
}) => {
  // Parse initial year and month from selectedDate or current date
  const initialDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [currentYear, setCurrentYear] = useState<number>(initialDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDateObj.getMonth()); // 0-indexed

  // Today string YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onSelectDate(todayStr);
  };

  // Generate days array for current month view
  const getDaysInMonth = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding from previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dateStr: '',
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Padding for next month to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dateStr: '',
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const daysGrid = getDaysInMonth(currentYear, currentMonth);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // Details for currently selected date
  const selectedList = shoppingLists[selectedDate];
  const totalItemsCount = selectedList?.items.length || 0;
  const checkedItemsCount = selectedList?.items.filter(i => i.isChecked).length || 0;
  const unboughtCount = totalItemsCount - checkedItemsCount;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Calendar Top Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Month Navigation Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-stone-800 tracking-tight">
              {currentYear}年 {currentMonth + 1}月
            </h2>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              今日
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
              title="前月"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
              title="次月"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-100/50 text-center py-2 text-xs font-bold">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-stone-600'}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 border-b border-stone-100">
          {daysGrid.map((dayObj, index) => {
            if (!dayObj.isCurrentMonth) {
              return (
                <div key={index} className="min-h-[90px] p-2 bg-stone-50/40 text-stone-300 select-none">
                  <span className="text-xs font-medium">{dayObj.dayNumber}</span>
                </div>
              );
            }

            const isSelected = dayObj.dateStr === selectedDate;
            const isToday = dayObj.dateStr === todayStr;
            const listForDay = shoppingLists[dayObj.dateStr];
            const itemCount = listForDay?.items?.length || 0;
            const completed = listForDay?.items?.every(i => i.isChecked) && itemCount > 0;
            const pendingCount = listForDay?.items?.filter(i => !i.isChecked).length || 0;

            const dayIndex = index % 7;
            const isSunday = dayIndex === 0;
            const isSaturday = dayIndex === 6;

            return (
              <div
                key={dayObj.dateStr}
                onClick={() => {
                  onSelectDate(dayObj.dateStr);
                }}
                className={`min-h-[90px] sm:min-h-[100px] p-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/90 ring-2 ring-emerald-600 z-10'
                    : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : isSunday
                        ? 'text-red-600'
                        : isSaturday
                        ? 'text-blue-600'
                        : 'text-stone-700'
                    }`}
                  >
                    {dayObj.dayNumber}
                  </span>

                  {isToday && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      今日
                    </span>
                  )}
                </div>

                {/* Badges for Shopping list on date */}
                <div className="mt-1 flex flex-col gap-1">
                  {itemCount > 0 ? (
                    <div
                      className={`text-[11px] p-1 rounded-md flex items-center justify-between font-medium ${
                        completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 shrink-0" />
                        {itemCount}件
                      </span>
                      {completed ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 shrink-0">
                          残{pendingCount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-stone-300 group-hover:text-stone-400 py-1 flex items-center justify-center">
                      + 追加
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details & Action Panel */}
      {selectedDate && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">選択中の日付</span>
                <h3 className="text-xl font-bold text-stone-900">
                  {selectedDate.replace('-', '年').replace('-', '月')}日
                </h3>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-stone-100 rounded-lg text-xs font-semibold text-stone-700">
                登録数: <span className="text-stone-900 text-sm font-bold">{totalItemsCount}</span> 件
              </div>
              {totalItemsCount > 0 && (
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    unboughtCount === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {unboughtCount === 0 ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 全購入完了
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 未購入 {unboughtCount} 件
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* List items preview or empty prompt */}
          {totalItemsCount > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-500">この日の買い物リスト概要:</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                {groups.flatMap(group => group.mediumGroups.flatMap(medium => medium.items)).map(item => (
                  <span
                    key={item.id}
                    className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-medium ${
                      item.isChecked
                        ? 'bg-stone-200 text-stone-500 line-through'
                        : 'bg-white border border-stone-200 text-stone-800 shadow-2xs'
                    }`}
                  >
                    {item.name} ({item.amount}{item.unit})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-500 italic py-2">
              この日付の買い物リストはまだ作成されていません。「リストを作成」ボタンを押して買うものを追加してください。
            </p>
          )}

          {/* Transition buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigateToCreator(selectedDate)}
              className="flex-1 min-w-[200px] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              買い物リストを作成・編集
            </button>

            <button
              onClick={() => onNavigateToShopping(selectedDate)}
              disabled={totalItemsCount === 0}
              className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                totalItemsCount === 0
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                  : 'bg-stone-800 hover:bg-stone-900 text-white shadow-sm'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              買い物モードで開く
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
