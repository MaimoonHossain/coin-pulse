import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';
import { X, Plus, Trash2, Check, Tag } from 'lucide-react-native';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface CategoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#D97706', // Yellow Dark
  '#14B8A6', // Teal
  '#A855F7', // Violet
];

const PRESET_ICONS = [
  'Utensils',
  'ShoppingBag',
  'Home',
  'Car',
  'ShoppingCart',
  'Film',
  'Activity',
  'BookOpen',
  'Wallet',
  'Laptop',
  'TrendingUp',
  'Gift',
  'Tag',
  'Coffee',
  'Heart',
  'Globe',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  visible,
  onClose,
}) => {
  const { categories, createCat, deleteCat } = useApp();

  const [activeType, setActiveType] = useState<TransactionType>('expense');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingCat, setDeletingCat] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredCategories = categories.filter(c => c.type === activeType);

  const handleCreateCategory = async () => {
    if (!name.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    try {
      await createCat({
        name: name.trim(),
        type: activeType,
        color,
        icon,
      });

      setName('');
      setShowAddForm(false);
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('Failed to create category');
    }
  };

  const handleConfirmDeleteCat = async () => {
    if (!deletingCat) return;
    const target = deletingCat;
    setDeletingCat(null);
    const ok = await deleteCat(target.id);
    if (!ok) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Cannot delete default system category.');
      } else {
        Alert.alert('Cannot Delete', 'Cannot delete default system category.');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Tag size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Category Master Data</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Type Toggle Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeType === 'expense' && styles.tabActiveExpense]}
              onPress={() => {
                setActiveType('expense');
                setShowAddForm(false);
              }}
            >
              <Text style={[styles.tabText, activeType === 'expense' && styles.tabTextActive]}>
                Expense Categories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeType === 'income' && styles.tabActiveIncome]}
              onPress={() => {
                setActiveType('income');
                setShowAddForm(false);
              }}
            >
              <Text style={[styles.tabText, activeType === 'income' && styles.tabTextActive]}>
                Income Categories
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {!showAddForm ? (
              <>
                <TouchableOpacity
                  style={styles.addTriggerBtn}
                  onPress={() => setShowAddForm(true)}
                >
                  <Plus size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.addTriggerText}>
                    + Add New {activeType === 'expense' ? 'Expense' : 'Income'} Category
                  </Text>
                </TouchableOpacity>

                <View style={styles.listContainer}>
                  {filteredCategories.map(cat => (
                    <View key={cat.id} style={styles.categoryCard}>
                      <View style={[styles.colorBadge, { backgroundColor: cat.color }]}>
                        <View style={styles.dotInside} />
                      </View>
                      <View style={styles.catInfo}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.catMeta}>
                          {cat.is_default ? 'System Default' : 'Custom Category'}
                        </Text>
                      </View>
                      {!cat.is_default && (
                        <TouchableOpacity
                          style={styles.deleteIconBtn}
                          onPress={() => setDeletingCat({ id: cat.id, name: cat.name })}
                        >
                          <Trash2 size={16} color={Colors.expense} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </>
            ) : (
              /* Add Category Form */
              <View style={styles.formContainer}>
                <Text style={styles.formHeaderTitle}>
                  Create New {activeType === 'expense' ? 'Expense' : 'Income'} Category
                </Text>

                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Subscriptions, Gym, Tuition..."
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={text => {
                    setName(text);
                    if (errorMsg) setErrorMsg('');
                  }}
                  autoFocus
                />

                {/* Color Selector */}
                <Text style={styles.label}>Category Color</Text>
                <View style={styles.paletteGrid}>
                  {PRESET_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        color === c && styles.selectedCircle,
                      ]}
                      onPress={() => setColor(c)}
                    >
                      {color === c && <Check size={14} color="#FFF" />}
                    </TouchableOpacity>
                  ))}
                </View>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <View style={styles.formActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCategory}>
                    <Check size={16} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.saveBtnText}>Save Category</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <ConfirmDeleteModal
        visible={deletingCat !== null}
        title="Delete Category?"
        message={deletingCat ? `Are you sure you want to delete category "${deletingCat.name}"?` : ''}
        onConfirm={handleConfirmDeleteCat}
        onCancel={() => setDeletingCat(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActiveExpense: {
    backgroundColor: Colors.expenseBg,
    borderColor: Colors.expense,
  },
  tabActiveIncome: {
    backgroundColor: Colors.incomeBg,
    borderColor: Colors.income,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  scroll: {
    marginBottom: 10,
  },
  addTriggerBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addTriggerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  colorBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dotInside: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  catMeta: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteIconBtn: {
    padding: 6,
  },
  formContainer: {
    backgroundColor: Colors.bg,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 6,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  errorText: {
    color: Colors.expense,
    fontSize: 12,
    marginTop: 6,
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
