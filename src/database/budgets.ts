import { getDB, isWeb, loadWebData, saveWebData } from './db';
import { Budget } from '../types';

export const getBudgetsForMonth = async (monthYear: string): Promise<Budget[]> => {
  if (isWeb) {
    const web = loadWebData();
    const startDate = `${monthYear}-01`;
    const endDate = `${monthYear}-31`;

    const categorySpentMap = new Map<string, number>();
    web.transactions
      .filter(t => t.type === 'expense' && t.date >= startDate && t.date <= endDate)
      .forEach(t => {
        categorySpentMap.set(
          t.category_id,
          (categorySpentMap.get(t.category_id) || 0) + t.amount
        );
      });

    return web.categories
      .filter(c => c.type === 'expense')
      .map(cat => {
        const b = web.budgets.find(b => b.category_id === cat.id && b.month_year === monthYear);
        return {
          id: b?.id || `b_${cat.id}_${monthYear}`,
          category_id: cat.id,
          category_name: cat.name,
          category_icon: cat.icon,
          category_color: cat.color,
          monthly_limit: b?.monthly_limit || 0,
          month_year: monthYear,
          spent: categorySpentMap.get(cat.id) || 0,
        };
      });
  }

  const db = await getDB();
  if (!db) return [];

  const startDate = `${monthYear}-01`;
  const endDate = `${monthYear}-31`;

  const rows = await db.getAllAsync<{
    id: string;
    category_id: string;
    category_name: string;
    category_icon: string;
    category_color: string;
    monthly_limit: number;
    month_year: string;
    spent: number;
  }>(
    `SELECT 
       c.id as category_id,
       c.name as category_name,
       c.icon as category_icon,
       c.color as category_color,
       COALESCE(b.id, 'b_' || c.id || '_' || ?) as id,
       COALESCE(b.monthly_limit, 0) as monthly_limit,
       ? as month_year,
       COALESCE(SUM(t.amount), 0) as spent
     FROM categories c
     LEFT JOIN budgets b ON c.id = b.category_id AND b.month_year = ?
     LEFT JOIN transactions t ON c.id = t.category_id AND t.type = 'expense' AND t.date BETWEEN ? AND ?
     WHERE c.type = 'expense'
     GROUP BY c.id
     ORDER BY monthly_limit DESC, c.name ASC;`,
    [monthYear, monthYear, monthYear, startDate, endDate]
  );

  return rows;
};

export const setBudgetLimit = async (
  categoryId: string,
  monthlyLimit: number,
  monthYear: string
): Promise<void> => {
  if (isWeb) {
    const web = loadWebData();
    const idx = web.budgets.findIndex(
      b => b.category_id === categoryId && b.month_year === monthYear
    );
    if (idx !== -1) {
      web.budgets[idx].monthly_limit = monthlyLimit;
    } else {
      web.budgets.push({
        id: `b_${categoryId}_${monthYear}`,
        category_id: categoryId,
        monthly_limit: monthlyLimit,
        month_year: monthYear,
      });
    }
    saveWebData();
    return;
  }

  const db = await getDB();
  if (db) {
    const id = `b_${categoryId}_${monthYear}`;
    await db.runAsync(
      `INSERT INTO budgets (id, category_id, monthly_limit, month_year)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(category_id, month_year) DO UPDATE SET monthly_limit = excluded.monthly_limit;`,
      [id, categoryId, monthlyLimit, monthYear]
    );
  }
};
