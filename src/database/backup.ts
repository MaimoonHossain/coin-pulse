import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDB, isWeb, loadWebData, saveWebData } from './db';
import { getCategories } from './categories';
import { getTransactions } from './transactions';
import { Category, Transaction, Budget } from '../types';

export interface BackupData {
  version: number;
  appName: string;
  exportedAt: string;
  currency: string;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

const FS = FileSystem as any;

const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message || '');
  }
};

export const exportBackupData = async (): Promise<boolean> => {
  try {
    const categories = await getCategories();
    const transactions = await getTransactions({ dateFilter: 'all' });

    let budgets: Budget[] = [];
    if (isWeb) {
      budgets = loadWebData().budgets;
    } else {
      const db = await getDB();
      if (db) {
        budgets = await db.getAllAsync<Budget>('SELECT * FROM budgets;');
      }
    }

    const backupPayload: BackupData = {
      version: 1,
      appName: 'CoinPulse',
      exportedAt: new Date().toISOString(),
      currency: '৳',
      categories,
      transactions,
      budgets,
    };

    const jsonStr = JSON.stringify(backupPayload, null, 2);
    const fileName = `CoinPulse_Backup_${new Date().toISOString().slice(0, 10)}.json`;

    // 1. Check for Web Browser environment (Blob download)
    const isWebBrowser =
      Platform.OS === 'web' ||
      (typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof document.createElement === 'function' &&
        !FS.documentDirectory &&
        !FS.cacheDirectory);

    if (isWebBrowser) {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {}
        }, 200);
        showAlert('Backup Exported', 'CoinPulse backup file downloaded successfully!');
        return true;
      } catch (webErr) {
        console.error('Web export failed:', webErr);
      }
    }

    // 2. Native Mobile (Android & iOS)
    let docDir: string | null = null;

    if (FS.documentDirectory) {
      docDir = FS.documentDirectory;
    } else if (FS.cacheDirectory) {
      docDir = FS.cacheDirectory;
    } else if (FS.Paths?.document?.uri) {
      docDir = FS.Paths.document.uri;
    } else if (FS.Paths?.document) {
      docDir = String(FS.Paths.document);
    } else if (FS.Paths?.cache?.uri) {
      docDir = FS.Paths.cache.uri;
    } else if (FS.Paths?.cache) {
      docDir = String(FS.Paths.cache);
    }

    if (!docDir) {
      // Fallback: If DOM is available in browser / hybrid Webview
      if (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof document.createElement === 'function'
      ) {
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {}
        }, 200);
        showAlert('Backup Exported', 'CoinPulse backup file downloaded successfully!');
        return true;
      }

      showAlert('Export Error', 'Device file storage is not accessible.');
      return false;
    }

    const fileUri = docDir.endsWith('/') ? `${docDir}${fileName}` : `${docDir}/${fileName}`;
    const encoding = FS.EncodingType?.UTF8 || 'utf8';

    await FS.writeAsStringAsync(fileUri, jsonStr, {
      encoding,
    });

    const isShareAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (isShareAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export CoinPulse Data Backup',
        UTI: 'public.json',
      });
      return true;
    } else {
      showAlert('Backup Exported', `Backup file saved successfully:\n${fileUri}`);
      return true;
    }
  } catch (error: any) {
    console.error('Backup export error:', error);
    showAlert('Export Failed', error?.message || 'Failed to export backup data.');
    return false;
  }
};

export const importBackupData = async (): Promise<boolean> => {
  try {
    let jsonContent = '';

    const isWebBrowser =
      Platform.OS === 'web' ||
      (typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof document.createElement === 'function' &&
        !FS.documentDirectory &&
        !FS.cacheDirectory);

    if (isWebBrowser) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      const filePromise = new Promise<string>((resolve, reject) => {
        input.onchange = e => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject('No file selected');
            return;
          }
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target?.result as string);
          reader.onerror = err => reject(err);
          reader.readAsText(file);
        };
      });
      input.click();
      jsonContent = await filePromise;
    } else {
      // Native Mobile Picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return false;
      }

      const fileUri = result.assets[0].uri;
      const encoding = FS.EncodingType?.UTF8 || 'utf8';
      jsonContent = await FS.readAsStringAsync(fileUri, {
        encoding,
      });
    }

    const data: BackupData = JSON.parse(jsonContent);

    if (!data.transactions || !data.categories) {
      showAlert('Import Failed', 'Invalid CoinPulse backup file format.');
      return false;
    }

    if (isWeb) {
      const web = loadWebData();
      web.categories = data.categories;
      web.transactions = data.transactions;
      web.budgets = data.budgets || [];
      saveWebData();
      showAlert('Backup Restored', 'Backup restored successfully!');
      return true;
    }

    const db = await getDB();
    if (!db) return false;

    // Clear existing tables and restore
    await db.execAsync('DELETE FROM transactions;');
    await db.execAsync('DELETE FROM budgets;');
    await db.execAsync('DELETE FROM categories;');

    for (const cat of data.categories) {
      await db.runAsync(
        'INSERT INTO categories (id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?);',
        [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.is_default ? 1 : 0]
      );
    }

    for (const tx of data.transactions) {
      await db.runAsync(
        `INSERT INTO transactions (id, amount, type, category_id, payment_method, date, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [tx.id, tx.amount, tx.type, tx.category_id, tx.payment_method, tx.date, tx.note || '', tx.created_at || new Date().toISOString()]
      );
    }

    if (data.budgets && data.budgets.length > 0) {
      for (const b of data.budgets) {
        await db.runAsync(
          'INSERT INTO budgets (id, category_id, monthly_limit, month_year) VALUES (?, ?, ?, ?);',
          [b.id, b.category_id, b.monthly_limit, b.month_year]
        );
      }
    }

    showAlert(
      'Backup Restored',
      `Successfully restored ${data.transactions.length} transactions and ${data.categories.length} categories!`
    );
    return true;
  } catch (error: any) {
    console.error('Backup import error:', error);
    showAlert('Import Failed', error?.message || 'Failed to import backup data.');
    return false;
  }
};

export const exportExcelData = async (customTransactions?: Transaction[]): Promise<boolean> => {
  try {
    const txList = customTransactions || (await getTransactions({ dateFilter: 'all' }));

    if (txList.length === 0) {
      showAlert('Export Excel', 'No transaction records available to export.');
      return false;
    }

    // CSV Format with UTF-8 BOM for Microsoft Excel compatibility
    let csvStr = '\uFEFF';
    csvStr += '"Date","Type","Category","Amount (BDT)","Payment Method","Note"\n';

    const escapeCsv = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatPaymentMethod = (pm?: string) => {
      if (!pm) return 'Other';
      switch (pm) {
        case 'mobile_banking':
          return 'Mobile Banking';
        case 'card':
          return 'Card';
        case 'cash':
          return 'Cash';
        case 'bank':
          return 'Bank Transfer';
        default:
          return pm.charAt(0).toUpperCase() + pm.slice(1);
      }
    };

    txList.forEach(t => {
      const date = escapeCsv(t.date);
      const type = escapeCsv(t.type === 'income' ? 'Income' : 'Expense');
      const category = escapeCsv(t.category_name || 'Uncategorized');
      const amount = escapeCsv(t.amount);
      const paymentMethod = escapeCsv(formatPaymentMethod(t.payment_method));
      const note = escapeCsv(t.note || '');

      csvStr += `${date},${type},${category},${amount},${paymentMethod},${note}\n`;
    });

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const fileName = `CoinPulse_Ledger_${dateSuffix}.csv`;

    // 1. Web Browser environment (Blob download)
    const isWebBrowser =
      Platform.OS === 'web' ||
      (typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof document.createElement === 'function' &&
        !FS.documentDirectory &&
        !FS.cacheDirectory);

    if (isWebBrowser) {
      try {
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {}
        }, 200);
        showAlert('Excel Exported', 'CoinPulse Excel ledger file downloaded successfully!');
        return true;
      } catch (webErr) {
        console.error('Web Excel export failed:', webErr);
      }
    }

    // 2. Native Mobile (Android & iOS)
    let docDir: string | null = null;
    if (FS.documentDirectory) {
      docDir = FS.documentDirectory;
    } else if (FS.cacheDirectory) {
      docDir = FS.cacheDirectory;
    } else if (FS.Paths?.document?.uri) {
      docDir = FS.Paths.document.uri;
    } else if (FS.Paths?.document) {
      docDir = String(FS.Paths.document);
    } else if (FS.Paths?.cache?.uri) {
      docDir = FS.Paths.cache.uri;
    } else if (FS.Paths?.cache) {
      docDir = String(FS.Paths.cache);
    }

    if (!docDir) {
      if (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof document.createElement === 'function'
      ) {
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {}
        }, 200);
        showAlert('Excel Exported', 'CoinPulse Excel ledger file downloaded successfully!');
        return true;
      }

      showAlert('Export Error', 'Device file storage is not accessible.');
      return false;
    }

    const fileUri = docDir.endsWith('/') ? `${docDir}${fileName}` : `${docDir}/${fileName}`;
    const encoding = FS.EncodingType?.UTF8 || 'utf8';

    await FS.writeAsStringAsync(fileUri, csvStr, {
      encoding,
    });

    const isShareAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (isShareAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export CoinPulse Excel Ledger',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    } else {
      showAlert('Excel Exported', `Excel file saved successfully:\n${fileUri}`);
      return true;
    }
  } catch (error: any) {
    console.error('Excel export error:', error);
    showAlert('Export Failed', error?.message || 'Failed to export Excel data.');
    return false;
  }
};

