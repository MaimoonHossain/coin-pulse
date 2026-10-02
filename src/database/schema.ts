export const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default INTEGER DEFAULT 0
  );
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    category_id TEXT NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'bank', 'mobile_banking', 'other')) NOT NULL DEFAULT 'cash',
    date TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
`;

export const CREATE_BUDGETS_TABLE = `
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    month_year TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, month_year)
  );
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;

// Pre-seeded default categories in Taka context
export const DEFAULT_CATEGORIES = [
  // Expenses
  { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#F59E0B', is_default: 1 },
  { id: 'cat_groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingBag', color: '#10B981', is_default: 1 },
  { id: 'cat_rent', name: 'Rent & Bills', type: 'expense', icon: 'Home', color: '#3B82F6', is_default: 1 },
  { id: 'cat_transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#8B5CF6', is_default: 1 },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingCart', color: '#EC4899', is_default: 1 },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#06B6D4', is_default: 1 },
  { id: 'cat_health', name: 'Health & Medical', type: 'expense', icon: 'Activity', color: '#F43F5E', is_default: 1 },
  { id: 'cat_education', name: 'Education', type: 'expense', icon: 'BookOpen', color: '#84CC16', is_default: 1 },
  { id: 'cat_exp_other', name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#64748B', is_default: 1 },

  // Income
  { id: 'cat_salary', name: 'Salary', type: 'income', icon: 'Wallet', color: '#10B981', is_default: 1 },
  { id: 'cat_freelance', name: 'Freelance & Business', type: 'income', icon: 'Laptop', color: '#6366F1', is_default: 1 },
  { id: 'cat_investment', name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#06B6D4', is_default: 1 },
  { id: 'cat_inc_other', name: 'Other Income', type: 'income', icon: 'Gift', color: '#F59E0B', is_default: 1 },
];
