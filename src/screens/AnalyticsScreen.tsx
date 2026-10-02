import React from 'react';
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
import { DonutChart } from '../components/DonutChart';
import { BarChart } from '../components/BarChart';
import { TrendChart } from '../components/TrendChart';
import {
  ChevronLeft,
  ChevronRight,
  PieChart,
  TrendingUp,
  DollarSign,
  Zap,
  Award,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';

export const AnalyticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top;
  const {
    monthlyIncome,
    monthlyExpense,
    categoryAggregates,
    dailyTrends,
    currency,
    selectedMonth,
    setSelectedMonth,
  } = useApp();

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const formatMonthTitle = (yearMonth: string) => {
    const [y, m] = yearMonth.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Accurate Elapsed Days Calculation
  const getElapsedDays = (yearMonth: string) => {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = yearMonth.split('-').map(Number);
    const totalDaysInSelectedMonth = new Date(y, m, 0).getDate();

    if (yearMonth === currentYearMonth) {
      return Math.max(1, Math.min(today.getDate(), totalDaysInSelectedMonth));
    } else if (yearMonth < currentYearMonth) {
      return totalDaysInSelectedMonth;
    } else {
      return 1;
    }
  };

  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number);
  const totalDaysInMonth = new Date(selYear, selMonthNum, 0).getDate();
  const elapsedDays = getElapsedDays(selectedMonth);

  const avgDailyExpense = Math.round(monthlyExpense / elapsedDays);
  const projectedEOMExpense = Math.round(avgDailyExpense * totalDaysInMonth);

  // Peak spending day from dailyTrends
  let peakDay = { date: '', expense: 0 };
  dailyTrends.forEach(d => {
    if (d.expense > peakDay.expense) {
      peakDay = { date: d.formatted_date, expense: d.expense };
    }
  });

  const topCategory = categoryAggregates.length > 0 ? categoryAggregates[0] : null;

  const netSavingsRate =
    monthlyIncome > 0
      ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100))
      : 0;

  const isOverBudget = monthlyExpense > monthlyIncome && monthlyIncome > 0;

  let insightText = '';
  if (monthlyExpense === 0) {
    insightText = 'No expenses recorded for this period. Excellent control over spending!';
  } else if (isOverBudget) {
    insightText = `Attention: Spending (${currency}${monthlyExpense.toLocaleString()}) exceeds income (${currency}${monthlyIncome.toLocaleString()}). Review high-impact categories below.`;
  } else if (topCategory) {
    insightText = `Pacing at ${currency}${avgDailyExpense.toLocaleString()}/day across ${elapsedDays} active days. Largest category is ${topCategory.category_name} (${topCategory.percentage}% of total).`;
  } else {
    insightText = `Average daily spend is ${currency}${avgDailyExpense.toLocaleString()}/day across ${elapsedDays} elapsed days.`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Text style={styles.title}>Visual Analytics</Text>

        {/* Month Selector Controls */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth}>
            <ChevronLeft size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatMonthTitle(selectedMonth)}</Text>
          <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth}>
            <ChevronRight size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Smart Financial Insights Banner */}
        <View style={[styles.insightCard, isOverBudget && styles.insightCardWarning]}>
          <View style={styles.insightHeader}>
            <Sparkles size={18} color={isOverBudget ? Colors.expense : Colors.primary} />
            <Text style={[styles.insightTitle, isOverBudget && { color: Colors.expense }]}>
              {isOverBudget ? 'Financial Warning' : 'Financial Insights'}
            </Text>
          </View>
          <Text style={styles.insightDesc}>{insightText}</Text>
        </View>

        {/* 4 Executive KPI Metric Cards */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Monthly Spend */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Spend</Text>
              <DollarSign size={16} color={Colors.expense} />
            </View>
            <Text style={styles.kpiValue}>
              {currency}{monthlyExpense.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubtext}>
              {monthlyIncome > 0 ? `Savings Rate: ${netSavingsRate}%` : 'Monthly Total'}
            </Text>
          </View>

          {/* Card 2: Daily Avg Spend */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Daily Avg</Text>
              <Zap size={16} color={Colors.warning} />
            </View>
            <Text style={styles.kpiValue}>
              {currency}{avgDailyExpense.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubtext}>{elapsedDays} Days Elapsed</Text>
          </View>

          {/* Card 3: Projected EOM Spend */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Projected EOM</Text>
              <Calendar size={16} color={Colors.primary} />
            </View>
            <Text style={styles.kpiValue}>
              {currency}{projectedEOMExpense.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubtext}>Forecast ({totalDaysInMonth}d)</Text>
          </View>

          {/* Card 4: Peak Single Day Spend */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Peak Day</Text>
              <Award size={16} color={Colors.income} />
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {peakDay.expense > 0 ? `${currency}${peakDay.expense.toLocaleString()}` : 'N/A'}
            </Text>
            <Text style={styles.kpiSubtext}>
              {peakDay.date ? `Spike on ${peakDay.date}` : 'No Spike'}
            </Text>
          </View>
        </View>

        {/* 1. Category Spending Distribution (Donut Chart) */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <PieChart size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Category Spending Distribution</Text>
          </View>
          <DonutChart
            data={categoryAggregates}
            currency={currency}
            totalExpense={monthlyExpense}
            size={190}
          />
        </View>

        {/* 2. Income vs Expense Comparison Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <DollarSign size={18} color={Colors.income} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Income vs Expense Ratio</Text>
          </View>
          <BarChart
            income={monthlyIncome}
            expense={monthlyExpense}
            currency={currency}
            height={190}
          />
        </View>

        {/* 3. Daily Spending Velocity Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <TrendingUp size={18} color={Colors.expense} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Daily Spending Velocity</Text>
          </View>
          <TrendChart data={dailyTrends} currency={currency} height={150} />
        </View>

        {/* Category Breakdown Ranking */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Award size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Category Spending Breakdown</Text>
          </View>
          {categoryAggregates.length === 0 ? (
            <Text style={styles.emptyText}>No category expenses recorded for this period.</Text>
          ) : (
            categoryAggregates.map((cat, idx) => (
              <View key={cat.category_id} style={styles.rankRow}>
                <View style={styles.rankNumberBadge}>
                  <Text style={styles.rankNumberText}>#{idx + 1}</Text>
                </View>

                <View style={styles.rankDetails}>
                  <View style={styles.rankTopRow}>
                    <View style={styles.rankNameRow}>
                      <View style={[styles.rankDot, { backgroundColor: cat.category_color }]} />
                      <Text style={styles.rankName}>{cat.category_name}</Text>
                      <Text style={styles.txCountBadge}>{cat.count} txns</Text>
                    </View>
                    <View style={styles.rankValueGroup}>
                      <Text style={styles.rankAmount}>
                        {currency}{cat.total_amount.toLocaleString()}
                      </Text>
                      <Text style={styles.rankPercentTag}>{cat.percentage}%</Text>
                    </View>
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.trackFill,
                        { width: `${cat.percentage}%`, backgroundColor: cat.category_color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    marginBottom: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arrowBtn: {
    padding: 6,
  },
  monthTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  insightCard: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginBottom: 16,
  },
  insightCardWarning: {
    backgroundColor: Colors.expenseBg,
    borderColor: Colors.expense + '40',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightTitle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  insightDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
  },
  kpiSubtext: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rankNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankNumberText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  rankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  rankDetails: {
    flex: 1,
  },
  rankTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  txCountBadge: {
    color: Colors.textMuted,
    fontSize: 10,
    backgroundColor: Colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankAmount: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  rankPercentTag: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
});
