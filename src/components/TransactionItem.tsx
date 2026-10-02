import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Transaction } from '../types';
import { Trash2, Pencil } from 'lucide-react-native';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface TransactionItemProps {
  transaction: Transaction;
  currency: string;
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  currency,
  onDelete,
  onEdit,
}) => {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const isIncome = transaction.type === 'income';

  const handleConfirmDelete = () => {
    setConfirmVisible(false);
    onDelete?.(transaction.id);
  };

  const paymentBadgeText =
    transaction.payment_method === 'mobile_banking'
      ? 'bKash / Nagad'
      : transaction.payment_method.toUpperCase();

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={onEdit ? 0.7 : 1}
        onPress={() => onEdit?.(transaction)}
      >
        <View style={[styles.iconContainer, { backgroundColor: (transaction.category_color || Colors.primary) + '20' }]}>
          <View style={[styles.iconDot, { backgroundColor: transaction.category_color || Colors.primary }]} />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.categoryTitle}>{transaction.category_name || 'Expense'}</Text>
          <View style={styles.subRow}>
            <Text style={styles.dateText}>{transaction.date}</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.methodBadge}>{paymentBadgeText}</Text>
          </View>
          {transaction.note ? <Text style={styles.noteText} numberOfLines={1}>{transaction.note}</Text> : null}
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, isIncome ? styles.incomeText : styles.expenseText]}>
            {isIncome ? '+' : '-'}{currency}{transaction.amount.toLocaleString()}
          </Text>
          <View style={styles.actionRow}>
            {onEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(transaction)}>
                <Pencil size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setConfirmVisible(true)}>
                <Trash2 size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {onDelete && (
        <ConfirmDeleteModal
          visible={confirmVisible}
          title="Delete Transaction?"
          message={`Are you sure you want to delete this ${transaction.type} of ${currency}${transaction.amount.toLocaleString()} (${transaction.category_name || 'Expense'})?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmVisible(false)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailsContainer: {
    flex: 1,
  },
  categoryTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 6,
  },
  methodBadge: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  noteText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  incomeText: {
    color: Colors.income,
  },
  expenseText: {
    color: Colors.expense,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    padding: 4,
  },
});
