import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { BudgetProgressBar } from '../components/BudgetProgressBar';
import { Target, Edit2, X, Check } from 'lucide-react-native';

export const BudgetScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top;
  const { budgets, currency, selectedMonth, updateBudget } = useApp();

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [limitInput, setLimitInput] = useState('');

  const openLimitModal = (catId: string, catName: string, currentLimit: number) => {
    setEditingCatId(catId);
    setEditingCatName(catName);
    setLimitInput(currentLimit > 0 ? currentLimit.toString() : '');
  };

  const handleSaveLimit = async () => {
    if (!editingCatId) return;
    const val = parseFloat(limitInput);
    const limitVal = isNaN(val) || val < 0 ? 0 : val;

    await updateBudget(editingCatId, limitVal);
    setEditingCatId(null);
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Text style={styles.title}>Monthly Budgets</Text>
        <Text style={styles.subTitle}>Set spending limits per category</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Overall Budget Overview Card */}
        <View style={styles.overallCard}>
          <View style={styles.cardHeaderRow}>
            <Target size={20} color={Colors.primary} />
            <Text style={styles.cardHeaderTitle}>Total Monthly Allocation</Text>
          </View>

          <Text style={styles.totalLimitText}>
            {currency}{totalSpent.toLocaleString()} / {totalBudgeted > 0 ? `${currency}${totalBudgeted.toLocaleString()}` : 'No Budget Set'}
          </Text>

          {totalBudgeted > 0 && (
            <View style={styles.track}>
              <View
                style={[
                  styles.trackFill,
                  {
                    width: `${Math.min(Math.round((totalSpent / totalBudgeted) * 100), 100)}%`,
                    backgroundColor:
                      totalSpent > totalBudgeted ? Colors.expense : Colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Category Budget Items */}
        <Text style={styles.sectionHeader}>Category Spending Limits</Text>

        {budgets.map(b => (
          <View key={b.category_id} style={styles.budgetRowContainer}>
            <View style={{ flex: 1 }}>
              <BudgetProgressBar
                categoryName={b.category_name || 'Category'}
                categoryColor={b.category_color}
                limit={b.monthly_limit}
                spent={b.spent || 0}
                currency={currency}
              />
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                openLimitModal(b.category_id, b.category_name || 'Category', b.monthly_limit)
              }
            >
              <Edit2 size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Set Budget Limit Modal */}
      <Modal visible={editingCatId !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Limit: {editingCatName}</Text>
              <TouchableOpacity onPress={() => setEditingCatId(null)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Monthly Limit in {currency}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={limitInput}
              onChangeText={setLimitInput}
              autoFocus
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLimit}>
              <Check size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  overallCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  totalLimitText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 4,
  },
  track: {
    height: 8,
    backgroundColor: Colors.bg,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeader: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  budgetRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: Colors.bgCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: 8,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
