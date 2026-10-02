import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { DateFilterType, TransactionType } from '../types';

interface FilterBarProps {
  selectedFilter: DateFilterType;
  onSelectFilter: (filter: DateFilterType) => void;
  selectedType: TransactionType | 'all';
  onSelectType: (type: TransactionType | 'all') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedFilter,
  onSelectFilter,
  selectedType,
  onSelectType,
}) => {
  const dateOptions: { key: DateFilterType; label: string }[] = [
    { key: 'this_month', label: 'This Month' },
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'all', label: 'All Time' },
  ];

  const typeOptions: { key: TransactionType | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'expense', label: 'Expenses' },
    { key: 'income', label: 'Income' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {dateOptions.map(opt => {
          const isActive = selectedFilter === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelectFilter(opt.key)}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.typeRow}>
        {typeOptions.map(t => {
          const isActive = selectedType === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.typeBadge,
                isActive && {
                  backgroundColor:
                    t.key === 'expense'
                      ? Colors.expenseBg
                      : t.key === 'income'
                      ? Colors.incomeBg
                      : Colors.primaryGlow,
                  borderColor:
                    t.key === 'expense'
                      ? Colors.expense
                      : t.key === 'income'
                      ? Colors.income
                      : Colors.primary,
                },
              ]}
              onPress={() => onSelectType(t.key)}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  isActive && {
                    color:
                      t.key === 'expense'
                        ? Colors.expense
                        : t.key === 'income'
                        ? Colors.income
                        : Colors.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pill: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  pillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  typeBadgeText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
