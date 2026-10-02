import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { TransactionItem } from '../components/TransactionItem';
import { FilterBar } from '../components/FilterBar';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { Search, Plus, Filter, X, FileSpreadsheet } from 'lucide-react-native';
import { DateFilterType, TransactionType, Transaction } from '../types';

export const TransactionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top;
  const { transactions, currency, removeTx, filters, setFilters, exportExcel } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleSelectFilter = (dateFilter: DateFilterType) => {
    setFilters(prev => ({ ...prev, dateFilter }));
  };

  const handleSelectType = (type: TransactionType | 'all') => {
    setFilters(prev => ({ ...prev, type }));
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setModalVisible(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalVisible(true);
  };

  const displayedTransactions = transactions.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.note && t.note.toLowerCase().includes(q)) ||
      (t.category_name && t.category_name.toLowerCase().includes(q)) ||
      t.amount.toString().includes(q)
    );
  });

  const totalFilteredSum = displayedTransactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Text style={styles.title}>Transaction Ledger</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => exportExcel(displayedTransactions)}
            activeOpacity={0.7}
          >
            <FileSpreadsheet size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.exportBtnText}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
            <Plus size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category, note, or amount..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Bar */}
        <FilterBar
          selectedFilter={filters.dateFilter}
          onSelectFilter={handleSelectFilter}
          selectedType={filters.type || 'all'}
          onSelectType={handleSelectType}
        />

        {/* Ledger Summary Stats */}
        <View style={styles.summaryBar}>
          <Text style={styles.recordCountText}>{displayedTransactions.length} Records</Text>
          <Text style={styles.netSumText}>
            Net: {currency}{totalFilteredSum.toLocaleString()}
          </Text>
        </View>

        {/* Transaction List */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {displayedTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Filter size={32} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No Matching Records</Text>
              <Text style={styles.emptyDesc}>
                Try adjusting your search query or filter selection.
              </Text>
            </View>
          ) : (
            displayedTransactions.map(tx => (
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
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#107C41',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    paddingVertical: 10,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 10,
  },
  recordCountText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  netSumText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
