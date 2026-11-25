import { DailyShoppingList } from '../types';
import {
  DEFAULT_LARGE_CATEGORIES,
  DEFAULT_MEDIUM_CATEGORIES,
  DEFAULT_MASTER_ITEMS,
} from '../data/defaultPresets';
import { APP_STORAGE_KEY_PREFIX, STORAGE_KEYS } from './storage';

export const BACKUP_FORMAT_VERSION = '1.0';
export const APP_NAME = '買い物リスト';
export const APP_VERSION = '1.2';

export interface BackupSummary {
  largeCategoriesCount: number;
  mediumCategoriesCount: number;
  masterItemsCount: number;
  dailyListsCount: number;
  totalShoppingItemsCount: number;
  storedKeyCount: number;
}

export interface BackupPayload {
  backupFormatVersion: string;
  appName: string;
  appVersion: string;
  createdAt: string;
  createdAtLocal: string;
  storageKeys: string[];
  keySources: Record<string, 'localStorage' | 'default'>;
  data: Record<string, unknown>;
  rawLocalStorage: Record<string, string>;
  summary: BackupSummary;
}

export interface BackupExportResult {
  fileName: string;
  jsonString: string;
  payload: BackupPayload;
  canShareFile: boolean;
}

const formatDateParts = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return {
    dateStr: `${y}-${m}-${d}`,
    dateTimeStr: `${y}-${m}-${d} ${hh}:${mm}:${ss}`,
  };
};

export const buildBackupFileName = (date: Date = new Date()): string => {
  const { dateStr } = formatDateParts(date);
  return `kaimono-backup-${dateStr}.json`;
};

const getDefaultFallbackForKey = (key: string): unknown => {
  switch (key) {
    case STORAGE_KEYS.LARGE_CATEGORIES:
      return DEFAULT_LARGE_CATEGORIES;
    case STORAGE_KEYS.MEDIUM_CATEGORIES:
      return DEFAULT_MEDIUM_CATEGORIES;
    case STORAGE_KEYS.MASTER_ITEMS:
      return DEFAULT_MASTER_ITEMS;
    case STORAGE_KEYS.SHOPPING_LISTS:
      return {};
    default:
      return null;
  }
};

export function summarizeBackupData(data: Record<string, unknown>, storedKeyCount: number): BackupSummary {
  const largeCategoriesData = data[STORAGE_KEYS.LARGE_CATEGORIES];
  const mediumCategoriesData = data[STORAGE_KEYS.MEDIUM_CATEGORIES];
  const masterItemsData = data[STORAGE_KEYS.MASTER_ITEMS];
  const dailyListsData = data[STORAGE_KEYS.SHOPPING_LISTS];

  let dailyListsCount = 0;
  let totalShoppingItemsCount = 0;

  if (dailyListsData && typeof dailyListsData === 'object' && !Array.isArray(dailyListsData)) {
    const listsRecord = dailyListsData as Record<string, DailyShoppingList>;
    const listEntries = Object.values(listsRecord);
    dailyListsCount = listEntries.length;
    totalShoppingItemsCount = listEntries.reduce((sum, list) => {
      if (list && Array.isArray(list.items)) {
        return sum + list.items.length;
      }
      return sum;
    }, 0);
  }

  return {
    largeCategoriesCount: Array.isArray(largeCategoriesData) ? largeCategoriesData.length : 0,
    mediumCategoriesCount: Array.isArray(mediumCategoriesData) ? mediumCategoriesData.length : 0,
    masterItemsCount: Array.isArray(masterItemsData) ? masterItemsData.length : 0,
    dailyListsCount,
    totalShoppingItemsCount,
    storedKeyCount,
  };
}

/**
 * Reads all app-specific data from localStorage without modifying or deleting anything.
 */
export const createBackupPayload = (now: Date = new Date()): BackupPayload => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    throw new Error('このブラウザではlocalStorageにアクセスできません。');
  }

  const coreKeys: string[] = [
    STORAGE_KEYS.LARGE_CATEGORIES,
    STORAGE_KEYS.MEDIUM_CATEGORIES,
    STORAGE_KEYS.MASTER_ITEMS,
    STORAGE_KEYS.SHOPPING_LISTS,
  ];

  const allKeys: string[] = [...coreKeys];

  // Collect any additional app-dedicated keys in localStorage (read-only)
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(APP_STORAGE_KEY_PREFIX) && !allKeys.includes(key)) {
      allKeys.push(key);
    }
  }

  const rawLocalStorage: Record<string, string> = {};
  const data: Record<string, unknown> = {};
  const keySources: Record<string, 'localStorage' | 'default'> = {};

  for (const key of allKeys) {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue !== null) {
      rawLocalStorage[key] = rawValue;
      keySources[key] = 'localStorage';
      try {
        data[key] = JSON.parse(rawValue);
      } catch {
        // Keep exact raw string if value is not JSON
        data[key] = rawValue;
      }
    } else {
      keySources[key] = 'default';
      data[key] = getDefaultFallbackForKey(key);
    }
  }

  const { dateTimeStr } = formatDateParts(now);

  return {
    backupFormatVersion: BACKUP_FORMAT_VERSION,
    appName: APP_NAME,
    appVersion: APP_VERSION,
    createdAt: now.toISOString(),
    createdAtLocal: dateTimeStr,
    storageKeys: allKeys,
    keySources,
    data,
    rawLocalStorage,
    summary: summarizeBackupData(data, Object.keys(rawLocalStorage).length),
  };
};

export const canShareBackupFile = (jsonString: string, fileName: string): boolean => {
  try {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function' ||
      typeof File === 'undefined'
    ) {
      return false;
    }
    const file = new File([jsonString], fileName, { type: 'application/json' });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};

/**
 * Triggers a JSON file download compatible with desktop browsers and iPhone Safari.
 */
export const triggerJsonDownload = (jsonString: string, fileName: string): void => {
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Delay revoking the object URL so iPhone Safari can finish reading the blob.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
};

/**
 * Shares the backup JSON file using the Web Share API (useful for iPhone Safari "Save to Files").
 */
export const shareBackupFile = async (
  jsonString: string,
  fileName: string
): Promise<'shared' | 'cancelled'> => {
  const file = new File([jsonString], fileName, { type: 'application/json' });
  try {
    await navigator.share({
      files: [file],
      title: fileName,
    });
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled';
    }
    throw error;
  }
};

/**
 * Exports all app localStorage data to a downloadable JSON file.
 */
export const exportAppDataBackup = (): BackupExportResult => {
  const now = new Date();
  const payload = createBackupPayload(now);
  const jsonString = JSON.stringify(payload, null, 2);
  const fileName = buildBackupFileName(now);

  triggerJsonDownload(jsonString, fileName);

  return {
    fileName,
    jsonString,
    payload,
    canShareFile: canShareBackupFile(jsonString, fileName),
  };
};
