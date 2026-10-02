import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { SummaryCard } from '../components/SummaryCard';
import { DonutChart } from '../components/DonutChart';
import { TransactionItem } from '../components/TransactionItem';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { Plus, ArrowRight, Wallet } from 'lucide-react-native';
import { Transaction } from '../types';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top;
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    currency,
    selectedMonth,
    categoryAggregates,
    transactions,
    removeTx,
    isReady,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const formatMonthName = (yearMonth: string) => {
    try {
      const [year, month] = yearMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (e) {
      return yearMonth;
    }
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setModalVisible(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalVisible(true);
  };

  const recentTransactions = transactions.slice(0, 5);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <Text style={styles.loadingText}>Loading CoinPulse...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Wallet size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.appName}>CoinPulse</Text>
            <Text style={styles.tagline}>Offline Expense Tracker</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.quickAddBtn}
          onPress={handleOpenAddModal}
        >
          <Plus size={18} color="#FFF" />
          <Text style={styles.quickAddText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Executive Summary Card */}
        <SummaryCard
          balance={totalBalance}
          income={monthlyIncome}
          expense={monthlyExpense}
          currency={currency}
          monthName={formatMonthName(selectedMonth)}
        />

        {/* Quick Donut Spending Preview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
              <Text style={styles.linkText}>View Full Charts</Text>
            </TouchableOpacity>
          </View>

          <DonutChart
            data={categoryAggregates}
            currency={currency}
            totalExpense={monthlyExpense}
            size={180}
          />
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity
            style={styles.viewAllRow}
            onPress={() => navigation.navigate('Ledger')}
          >
            <Text style={styles.linkText}>View All</Text>
            <ArrowRight size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the "+ Add" button above to log your first income or expense transaction!
            </Text>
          </View>
        ) : (
          recentTransactions.map(tx => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              currency={currency}
              onDelete={removeTx}
              onEdit={handleEditTransaction}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Add Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddModal}
        activeOpacity={0.8}
      >
        <Plus size={26} color="#FFF" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={modalVisible}
        initialTransaction={editingTransaction}
        onClose={() => {
          setModalVisible(false);
          setEditingTransaction(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quickAddText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
