import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface BudgetProgressBarProps {
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  limit: number;
  spent: number;
  currency: string;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  categoryName,
  categoryColor = Colors.primary,
  limit,
  spent,
  currency,
}) => {
  const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
  const isOverBudget = limit > 0 && spent > limit;
  const isWarning = limit > 0 && percent >= 80 && !isOverBudget;

  const barColor = isOverBudget ? Colors.expense : isWarning ? Colors.warning : categoryColor;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.categoryTitleRow}>
          <View style={[styles.dot, { backgroundColor: categoryColor }]} />
          <Text style={styles.categoryName}>{categoryName}</Text>
        </View>
        <Text style={styles.amountText}>
          {currency}{spent.toLocaleString()} / {limit > 0 ? `${currency}${limit.toLocaleString()}` : 'No Limit'}
        </Text>
      </View>

      {limit > 0 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      )}

      {limit > 0 && (
        <View style={styles.footer}>
          <Text style={styles.percentText}>{percent}% Spent</Text>
          {isOverBudget ? (
            <Text style={styles.alertOver}>Over Limit!</Text>
          ) : isWarning ? (
            <Text style={styles.alertWarning}>Near Limit (80%+)</Text>
          ) : (
            <Text style={styles.remainingText}>
              Remaining: {currency}{(limit - spent).toLocaleString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  amountText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.bg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  remainingText: {
    color: Colors.income,
    fontSize: 11,
    fontWeight: '600',
  },
  alertOver: {
    color: Colors.expense,
    fontSize: 11,
    fontWeight: '700',
  },
  alertWarning: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
});
