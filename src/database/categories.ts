import { getDB, isWeb, loadWebData, saveWebData } from './db';
import { Category, TransactionType } from '../types';

export const getCategories = async (type?: TransactionType): Promise<Category[]> => {
  if (isWeb) {
    const web = loadWebData();
    if (type) return web.categories.filter(c => c.type === type);
    return web.categories;
  }

  const db = await getDB();
  if (!db) return [];

  if (type) {
    return await db.getAllAsync<Category>(
      'SELECT id, name, type, icon, color, is_default FROM categories WHERE type = ? ORDER BY is_default DESC, name ASC;',
      [type]
    );
  }

  return await db.getAllAsync<Category>(
    'SELECT id, name, type, icon, color, is_default FROM categories ORDER BY type ASC, is_default DESC, name ASC;'
  );
};

export const addCategory = async (category: Omit<Category, 'id' | 'is_default'>): Promise<Category> => {
  const newId = 'cat_user_' + Date.now();
  const newCat: Category = {
    ...category,
    id: newId,
    is_default: false,
  };

  if (isWeb) {
    const web = loadWebData();
    web.categories.push(newCat);
    saveWebData();
    return newCat;
  }

  const db = await getDB();
  if (db) {
    await db.runAsync(
      'INSERT INTO categories (id, name, type, icon, color, is_default) VALUES (?, ?, ?, ?, ?, 0);',
      [newCat.id, newCat.name, newCat.type, newCat.icon, newCat.color]
    );
  }
  return newCat;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  if (isWeb) {
    const web = loadWebData();
    const idx = web.categories.findIndex(c => c.id === id);
    if (idx !== -1 && !web.categories[idx].is_default) {
      web.categories.splice(idx, 1);
      saveWebData();
      return true;
    }
    return false;
  }

  const db = await getDB();
  if (db) {
    await db.runAsync('DELETE FROM categories WHERE id = ? AND is_default = 0;', [id]);
    return true;
  }
  return false;
};
