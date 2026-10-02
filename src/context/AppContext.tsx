import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase } from '../database/db';
import { getCategories, addCategory, deleteCategory } from '../database/categories';
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  getCategoryAggregates,
  getDailyTrends,
  getMonthlyTrends,
  getAllTimeStats,
  MonthlyTrendPoint,
  AllTimeStats,
} from '../database/transactions';
import { getBudgetsForMonth, setBudgetLimit } from '../database/budgets';
import { exportBackupData, importBackupData, exportExcelData } from '../database/backup';
import {
  Transaction,
  Category,
  Budget,
  FilterOptions,
  CategoryAggregate,
  DailyTrend,
  TransactionType,
  DateFilterType,
} from '../types';

interface AppContextType {
  isReady: boolean;
  currency: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  categoryAggregates: CategoryAggregate[];
  dailyTrends: DailyTrend[];
  monthlyTrends: MonthlyTrendPoint[];
  allTimeStats: AllTimeStats | null;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netSavings: number;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  refreshData: () => Promise<void>;
  addTx: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  removeTx: (id: string) => Promise<void>;
  editTx: (tx: Transaction) => Promise<void>;
  updateBudget: (categoryId: string, limit: number) => Promise<void>;
  exportData: () => Promise<boolean>;
  exportExcel: (customTransactions?: Transaction[]) => Promise<boolean>;
  importData: () => Promise<boolean>;
  createCat: (cat: Omit<Category, 'id' | 'is_default'>) => Promise<Category>;
  deleteCat: (id: string) => Promise<boolean>;
}

const getCurrentMonthStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getDateRange = (
  dateFilter: DateFilterType,
  selectedMonth: string
): { startDate?: string; endDate?: string } => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (dateFilter === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (dateFilter === 'this_week') {
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };

    return {
      startDate: formatD(monday),
      endDate: formatD(sunday),
    };
  }

  if (dateFilter === 'this_month') {
    const [y, m] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return {
      startDate: `${selectedMonth}-01`,
      endDate: `${selectedMonth}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  if (dateFilter === 'last_month') {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(prevYear, prevDate.getMonth() + 1, 0).getDate();
    return {
      startDate: `${prevYear}-${prevMonth}-01`,
      endDate: `${prevYear}-${prevMonth}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  if (dateFilter === 'this_year') {
    const y = selectedMonth.slice(0, 4);
    return {
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
    };
  }

  return { startDate: undefined, endDate: undefined };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [currency] = useState('৳');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateFilter: 'this_month',
    type: 'all',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoryAggregates, setCategoryAggregates] = useState<CategoryAggregate[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendPoint[]>([]);
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);

  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [netSavings, setNetSavings] = useState(0);

  const loadData = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);

      // Determine date range for month stats
      const [selYear, selMonth] = selectedMonth.split('-').map(Number);
      const selLastDay = new Date(selYear, selMonth, 0).getDate();
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = `${selectedMonth}-${String(selLastDay).padStart(2, '0')}`;

      // Calculate filter date bounds for ledger
      const { startDate: rangeStart, endDate: rangeEnd } = getDateRange(
        filters.dateFilter,
        selectedMonth
      );

      const txs = await getTransactions({
        ...filters,
        startDate: filters.startDate || rangeStart,
        endDate: filters.endDate || rangeEnd,
      });
      setTransactions(txs);

      // Calculate totals across ALL transactions for balance
      const allTxs = await getTransactions({ dateFilter: 'all' });
      let balance = 0;
      let incMonth = 0;
      let expMonth = 0;

      allTxs.forEach(t => {
        if (t.type === 'income') balance += t.amount;
        else balance -= t.amount;

        if (t.date >= monthStart && t.date <= monthEnd) {
          if (t.type === 'income') incMonth += t.amount;
          else expMonth += t.amount;
        }
      });

      setTotalBalance(balance);
      setMonthlyIncome(incMonth);
      setMonthlyExpense(expMonth);
      setNetSavings(incMonth - expMonth);

      // Category Aggregates & Trends for current month
      const aggregates = await getCategoryAggregates(monthStart, monthEnd, 'expense');
      setCategoryAggregates(aggregates);

      const trends = await getDailyTrends(monthStart, monthEnd);
      setDailyTrends(trends);

      // Multi-month trends (last 6 months) & all-time stats
      const mTrends = await getMonthlyTrends(6);
      setMonthlyTrends(mTrends);

      const atStats = await getAllTimeStats();
      setAllTimeStats(atStats);

      // Budgets
      const bList = await getBudgetsForMonth(selectedMonth);
      setBudgets(bList);
    } catch (e) {
      console.error('Failed loading AppContext data:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await initDatabase();
      if (isMounted) {
        await loadData();
        setIsReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [selectedMonth, filters]);

  const refreshData = async () => {
    await loadData();
  };

  const addTx = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    await addTransaction(tx);
    await refreshData();
  };

  const removeTx = async (id: string) => {
    await deleteTransaction(id);
    await refreshData();
  };

  const editTx = async (tx: Transaction) => {
    await updateTransaction(tx);
    await refreshData();
  };

  const updateBudget = async (categoryId: string, limit: number) => {
    await setBudgetLimit(categoryId, limit, selectedMonth);
    await refreshData();
  };

  const exportData = async (): Promise<boolean> => {
    return await exportBackupData();
  };

  const exportExcel = async (customTransactions?: Transaction[]): Promise<boolean> => {
    return await exportExcelData(customTransactions);
  };

  const importData = async (): Promise<boolean> => {
    const success = await importBackupData();
    if (success) {
      await refreshData();
    }
    return success;
  };

  const createCat = async (cat: Omit<Category, 'id' | 'is_default'>) => {
    const newCat = await addCategory(cat);
    await refreshData();
    return newCat;
  };

  const deleteCat = async (id: string) => {
    const success = await deleteCategory(id);
    if (success) {
      await refreshData();
    }
    return success;
  };

  return (
    <AppContext.Provider
      value={{
        isReady,
        currency,
        transactions,
        categories,
        budgets,
        categoryAggregates,
        dailyTrends,
        monthlyTrends,
        allTimeStats,
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        netSavings,
        selectedMonth,
        setSelectedMonth,
        filters,
        setFilters,
        refreshData,
        addTx,
        removeTx,
        editTx,
        updateBudget,
        exportData,
        exportExcel,
        importData,
        createCat,
        deleteCat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
