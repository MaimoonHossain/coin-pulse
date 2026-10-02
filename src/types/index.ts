export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'cash' | 'card' | 'bank' | 'mobile_banking' | 'other';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Lucide icon name
  color: string; // Hex color code
  is_default: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  payment_method: PaymentMethod;
  date: string; // YYYY-MM-DD
  note?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  monthly_limit: number;
  month_year: string; // YYYY-MM
  spent?: number;
}

export interface AppSettings {
  currency: string; // '৳'
  theme: 'dark' | 'light';
  notifications_enabled: boolean;
}

export interface CategoryAggregate {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total_amount: number;
  percentage: number;
  count: number;
}

export interface DailyTrend {
  date: string;
  formatted_date: string;
  expense: number;
  income: number;
}

export type DateFilterType = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';

export interface FilterOptions {
  dateFilter: DateFilterType;
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
  categoryId?: string;
  searchQuery?: string;
}
