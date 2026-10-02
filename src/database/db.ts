import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import {
  CREATE_CATEGORIES_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_BUDGETS_TABLE,
  CREATE_SETTINGS_TABLE,
  DEFAULT_CATEGORIES,
} from './schema';
import { Transaction, Category, Budget } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let webStorage: {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: Record<string, string>;
} | null = null;

const WEB_STORAGE_KEY = '@coinpulse_web_db_v1';

// Web LocalStorage helper for zero-hassle web browser runner
const loadWebData = () => {
  if (webStorage) return webStorage;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(WEB_STORAGE_KEY) : null;
    if (raw) {
      webStorage = JSON.parse(raw);
      // Ensure missing default categories are merged
      DEFAULT_CATEGORIES.forEach(dc => {
        if (!webStorage!.categories.some(c => c.id === dc.id)) {
          webStorage!.categories.push({
            ...dc,
            type: dc.type as 'expense' | 'income',
            is_default: Boolean(dc.is_default),
          });
        }
      });
      saveWebData();
    } else {
      webStorage = {
        categories: DEFAULT_CATEGORIES.map(c => ({
          ...c,
          type: c.type as 'expense' | 'income',
          is_default: Boolean(c.is_default),
        })),
        transactions: [],
        budgets: [],
        settings: { currency: '৳' },
      };
      saveWebData();
    }
  } catch (e) {
    webStorage = {
      categories: DEFAULT_CATEGORIES.map(c => ({
        ...c,
        type: c.type as 'expense' | 'income',
        is_default: Boolean(c.is_default),
      })),
      transactions: [],
      budgets: [],
      settings: { currency: '৳' },
    };
  }
  return webStorage!;
};

const saveWebData = () => {
  if (!webStorage || typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(webStorage));
  } catch (e) {
    console.error('Failed to persist web database:', e);
  }
};

export const isWeb = Platform.OS === 'web';

export const getDB = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (isWeb) return null;
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('coinpulse.db');
  }
  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  if (isWeb) {
    loadWebData();
    return;
  }

  try {
    const db = await getDB();
    if (!db) return;

    // Enable WAL mode & foreign keys
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create Tables
    await db.execAsync(CREATE_CATEGORIES_TABLE);
    await db.execAsync(CREATE_TRANSACTIONS_TABLE);
    await db.execAsync(CREATE_BUDGETS_TABLE);
    await db.execAsync(CREATE_SETTINGS_TABLE);

    // Ensure all default categories are seeded/synced
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?);',
        [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.is_default]
      );
    }

    // Default currency setting
    const existingCurr = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM settings WHERE key = ?;', ['currency']);
    if (existingCurr[0].count === 0) {
      await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?);', ['currency', '৳']);
    }
  } catch (error) {
    console.error('SQLite Database init error:', error);
  }
};

export { loadWebData, saveWebData };
