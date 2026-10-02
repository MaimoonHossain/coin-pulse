import { getDB, isWeb, loadWebData, saveWebData } from './db';
import { Transaction, FilterOptions, CategoryAggregate, DailyTrend } from '../types';

export const addTransaction = async (
  tx: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction> => {
  const newTx: Transaction = {
    ...tx,
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
  };

  if (isWeb) {
    const web = loadWebData();
    const cat = web.categories.find(c => c.id === newTx.category_id);
    newTx.category_name = cat?.name || 'Uncategorized';
    newTx.category_icon = cat?.icon || 'DollarSign';
    newTx.category_color = cat?.color || '#64748B';

    web.transactions.unshift(newTx);
    saveWebData();
    return newTx;
  }

  const db = await getDB();
  if (db) {
    await db.runAsync(
      `INSERT INTO transactions (id, amount, type, category_id, payment_method, date, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newTx.id,
        newTx.amount,
        newTx.type,
        newTx.category_id,
        newTx.payment_method,
        newTx.date,
        newTx.note || '',
        newTx.created_at,
      ]
    );
  }

  return newTx;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (isWeb) {
    const web = loadWebData();
    web.transactions = web.transactions.filter(t => t.id !== id);
    saveWebData();
    return;
  }

  const db = await getDB();
  if (db) {
    await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
  }
};

export const updateTransaction = async (tx: Transaction): Promise<void> => {
  if (isWeb) {
    const web = loadWebData();
    const idx = web.transactions.findIndex(t => t.id === tx.id);
    if (idx !== -1) {
      web.transactions[idx] = { ...tx };
      saveWebData();
    }
    return;
  }

  const db = await getDB();
  if (db) {
    await db.runAsync(
      `UPDATE transactions 
       SET amount = ?, type = ?, category_id = ?, payment_method = ?, date = ?, note = ?
       WHERE id = ?;`,
      [tx.amount, tx.type, tx.category_id, tx.payment_method, tx.date, tx.note || '', tx.id]
    );
  }
};

export const getTransactions = async (filters?: FilterOptions): Promise<Transaction[]> => {
  if (isWeb) {
    const web = loadWebData();
    let res = [...web.transactions];

    if (filters) {
      if (filters.type && filters.type !== 'all') {
        res = res.filter(t => t.type === filters.type);
      }
      if (filters.categoryId) {
        res = res.filter(t => t.category_id === filters.categoryId);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        res = res.filter(
          t =>
            (t.note && t.note.toLowerCase().includes(q)) ||
            (t.category_name && t.category_name.toLowerCase().includes(q)) ||
            t.amount.toString().includes(q)
        );
      }
      if (filters.startDate && filters.endDate) {
        res = res.filter(t => t.date >= filters.startDate! && t.date <= filters.endDate!);
      }
    }

    // Attach category details
    res = res.map(t => {
      const cat = web.categories.find(c => c.id === t.category_id);
      return {
        ...t,
        category_name: cat?.name || 'Uncategorized',
        category_icon: cat?.icon || 'MoreHorizontal',
        category_color: cat?.color || '#64748B',
      };
    });

    res.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    return res;
  }

  const db = await getDB();
  if (!db) return [];

  let query = `
    SELECT 
      t.id, t.amount, t.type, t.category_id, t.payment_method, t.date, t.note, t.created_at,
      c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.type && filters.type !== 'all') {
    query += ' AND t.type = ?';
    params.push(filters.type);
  }
  if (filters?.categoryId) {
    query += ' AND t.category_id = ?';
    params.push(filters.categoryId);
  }
  if (filters?.searchQuery) {
    query += ' AND (t.note LIKE ? OR c.name LIKE ? OR CAST(t.amount AS TEXT) LIKE ?)';
    const term = `%${filters.searchQuery}%`;
    params.push(term, term, term);
  }
  if (filters?.startDate && filters?.endDate) {
    query += ' AND t.date BETWEEN ? AND ?';
    params.push(filters.startDate, filters.endDate);
  }

  query += ' ORDER BY t.date DESC, t.created_at DESC;';

  return await db.getAllAsync<Transaction>(query, params);
};

export const getCategoryAggregates = async (
  startDate: string,
  endDate: string,
  type: 'expense' | 'income' = 'expense'
): Promise<CategoryAggregate[]> => {
  if (isWeb) {
    const web = loadWebData();
    const filtered = web.transactions.filter(
      t => t.type === type && t.date >= startDate && t.date <= endDate
    );

    const totalAll = filtered.reduce((sum, t) => sum + t.amount, 0);
    const map = new Map<string, { total: number; count: number }>();

    filtered.forEach(t => {
      const existing = map.get(t.category_id) || { total: 0, count: 0 };
      map.set(t.category_id, {
        total: existing.total + t.amount,
        count: existing.count + 1,
      });
    });

    const result: CategoryAggregate[] = [];
    map.forEach((val, catId) => {
      const cat = web.categories.find(c => c.id === catId);
      result.push({
        category_id: catId,
        category_name: cat?.name || 'Uncategorized',
        category_color: cat?.color || '#64748B',
        category_icon: cat?.icon || 'MoreHorizontal',
        total_amount: val.total,
        percentage: totalAll > 0 ? Math.round((val.total / totalAll) * 100) : 0,
        count: val.count,
      });
    });

    result.sort((a, b) => b.total_amount - a.total_amount);
    return result;
  }

  const db = await getDB();
  if (!db) return [];

  const rows = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_color: string;
    category_icon: string;
    total_amount: number;
    count: number;
  }>(
    `SELECT 
       t.category_id, 
       c.name as category_name, 
       c.color as category_color, 
       c.icon as category_icon, 
       SUM(t.amount) as total_amount,
       COUNT(t.id) as count
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.type = ? AND t.date BETWEEN ? AND ?
     GROUP BY t.category_id
     ORDER BY total_amount DESC;`,
    [type, startDate, endDate]
  );

  const grandTotal = rows.reduce((sum, r) => sum + r.total_amount, 0);

  return rows.map(r => ({
    ...r,
    percentage: grandTotal > 0 ? Math.round((r.total_amount / grandTotal) * 100) : 0,
  }));
};

export const getDailyTrends = async (startDate: string, endDate: string): Promise<DailyTrend[]> => {
  if (isWeb) {
    const web = loadWebData();
    const filtered = web.transactions.filter(t => t.date >= startDate && t.date <= endDate);
    const map = new Map<string, { expense: number; income: number }>();

    filtered.forEach(t => {
      const current = map.get(t.date) || { expense: 0, income: 0 };
      if (t.type === 'expense') current.expense += t.amount;
      else current.income += t.amount;
      map.set(t.date, current);
    });

    const dates = Array.from(map.keys()).sort();
    return dates.map(d => ({
      date: d,
      formatted_date: d.slice(8, 10) + '/' + d.slice(5, 7),
      expense: map.get(d)!.expense,
      income: map.get(d)!.income,
    }));
  }

  const db = await getDB();
  if (!db) return [];

  const rows = await db.getAllAsync<{
    date: string;
    expense: number;
    income: number;
  }>(
    `SELECT 
       date,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
     FROM transactions
     WHERE date BETWEEN ? AND ?
     GROUP BY date
     ORDER BY date ASC;`,
    [startDate, endDate]
  );

  return rows.map(r => ({
    ...r,
    formatted_date: r.date.slice(8, 10) + '/' + r.date.slice(5, 7),
  }));
};

export interface MonthlyTrendPoint {
  month: string; // YYYY-MM
  label: string; // e.g. 'Oct'
  income: number;
  expense: number;
  savings: number;
}

export interface AllTimeStats {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  totalTransactions: number;
  highestExpenseMonth: string;
  highestExpenseAmount: number;
  avgMonthlyExpense: number;
  avgMonthlyIncome: number;
  activeMonths: number;
}

export const getMonthlyTrends = async (lastNMonths: number = 6): Promise<MonthlyTrendPoint[]> => {
  // Build last N months list
  const months: string[] = [];
  const now = new Date();
  for (let i = lastNMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
  }

  const monthLabels: Record<string, string> = {};
  months.forEach(mo => {
    const [y, m] = mo.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    monthLabels[mo] = d.toLocaleString('default', { month: 'short' });
  });

  if (isWeb) {
    const web = loadWebData();
    const result: MonthlyTrendPoint[] = months.map(mo => {
      const [y, m] = mo.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const start = `${mo}-01`;
      const end = `${mo}-${String(lastDay).padStart(2, '0')}`;
      let inc = 0;
      let exp = 0;
      web.transactions.forEach(t => {
        if (t.date >= start && t.date <= end) {
          if (t.type === 'income') inc += t.amount;
          else exp += t.amount;
        }
      });
      return { month: mo, label: monthLabels[mo], income: inc, expense: exp, savings: inc - exp };
    });
    return result;
  }

  const db = await getDB();
  if (!db) return [];

  const result: MonthlyTrendPoint[] = [];
  for (const mo of months) {
    const [y, m] = mo.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const start = `${mo}-01`;
    const end = `${mo}-${String(lastDay).padStart(2, '0')}`;

    const row = await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
       FROM transactions
       WHERE date BETWEEN ? AND ?;`,
      [start, end]
    );
    const inc = row?.income || 0;
    const exp = row?.expense || 0;
    result.push({ month: mo, label: monthLabels[mo], income: inc, expense: exp, savings: inc - exp });
  }
  return result;
};

export const getAllTimeStats = async (): Promise<AllTimeStats> => {
  if (isWeb) {
    const web = loadWebData();
    let totalIncome = 0;
    let totalExpense = 0;
    const monthMap = new Map<string, { inc: number; exp: number }>();

    web.transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
      const mo = t.date.slice(0, 7);
      const cur = monthMap.get(mo) || { inc: 0, exp: 0 };
      if (t.type === 'income') cur.inc += t.amount;
      else cur.exp += t.amount;
      monthMap.set(mo, cur);
    });

    let highestExpenseMonth = '';
    let highestExpenseAmount = 0;
    monthMap.forEach((val, mo) => {
      if (val.exp > highestExpenseAmount) {
        highestExpenseAmount = val.exp;
        highestExpenseMonth = mo;
      }
    });

    const activeMonths = monthMap.size;
    return {
      totalIncome,
      totalExpense,
      totalSavings: totalIncome - totalExpense,
      totalTransactions: web.transactions.length,
      highestExpenseMonth,
      highestExpenseAmount,
      avgMonthlyExpense: activeMonths > 0 ? Math.round(totalExpense / activeMonths) : 0,
      avgMonthlyIncome: activeMonths > 0 ? Math.round(totalIncome / activeMonths) : 0,
      activeMonths,
    };
  }

  const db = await getDB();
  if (!db) {
    return {
      totalIncome: 0, totalExpense: 0, totalSavings: 0,
      totalTransactions: 0, highestExpenseMonth: '', highestExpenseAmount: 0,
      avgMonthlyExpense: 0, avgMonthlyIncome: 0, activeMonths: 0,
    };
  }

  const totals = await db.getFirstAsync<{ income: number; expense: number; txCount: number }>(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
       COUNT(id) as txCount
     FROM transactions;`
  );

  const monthRows = await db.getAllAsync<{ mo: string; exp: number; inc: number }>(
    `SELECT
       strftime('%Y-%m', date) as mo,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as exp,
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as inc
     FROM transactions
     GROUP BY mo
     ORDER BY exp DESC;`
  );

  const totalIncome = totals?.income || 0;
  const totalExpense = totals?.expense || 0;
  const txCount = totals?.txCount || 0;
  const activeMonths = monthRows.length;
  const topMonth = monthRows[0];

  return {
    totalIncome,
    totalExpense,
    totalSavings: totalIncome - totalExpense,
    totalTransactions: txCount,
    highestExpenseMonth: topMonth?.mo || '',
    highestExpenseAmount: topMonth?.exp || 0,
    avgMonthlyExpense: activeMonths > 0 ? Math.round(totalExpense / activeMonths) : 0,
    avgMonthlyIncome: activeMonths > 0 ? Math.round(totalIncome / activeMonths) : 0,
    activeMonths,
  };
};
