import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface SummaryCardProps {
  balance: number;
  income: number;
  expense: number;
  currency: string;
  monthName: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  balance,
  income,
  expense,
  currency,
  monthName,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.monthBadge}>Overview • {monthName}</Text>

      <Text style={styles.balanceLabel}>Total Net Balance</Text>
      <Text style={styles.balanceValue}>
        {currency}{balance.toLocaleString()}
      </Text>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, styles.incomeBox]}>
          <View style={styles.indicatorRow}>
            <View style={[styles.dot, { backgroundColor: Colors.income }]} />
            <Text style={styles.statLabel}>Income</Text>
          </View>
          <Text style={styles.incomeValue}>
            +{currency}{income.toLocaleString()}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.statBox, styles.expenseBox]}>
          <View style={styles.indicatorRow}>
            <View style={[styles.dot, { backgroundColor: Colors.expense }]} />
            <Text style={styles.statLabel}>Expense</Text>
          </View>
          <Text style={styles.expenseValue}>
            -{currency}{expense.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  monthBadge: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  balanceLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  balanceValue: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
  },
  incomeBox: {
    paddingRight: 8,
  },
  expenseBox: {
    paddingLeft: 8,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  incomeValue: {
    color: Colors.income,
    fontSize: 16,
    fontWeight: '700',
  },
  expenseValue: {
    color: Colors.expense,
    fontSize: 16,
    fontWeight: '700',
  },
});
