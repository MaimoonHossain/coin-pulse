import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface BarChartProps {
  income: number;
  expense: number;
  currency: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  income,
  expense,
  currency,
  height = 180,
}) => {
  const maxVal = Math.max(income, expense, 1000);
  const chartHeight = height - 40; // reserve space for labels
  const width = 280;
  const barWidth = 48;

  const incomeBarHeight = (income / maxVal) * chartHeight;
  const expenseBarHeight = (expense / maxVal) * chartHeight;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Horizontal gridlines */}
        <Line
          x1="0"
          y1={chartHeight}
          x2={width}
          y2={chartHeight}
          stroke={Colors.border}
          strokeWidth="1"
        />
        <Line
          x1="0"
          y1={chartHeight / 2}
          x2={width}
          y2={chartHeight / 2}
          stroke={Colors.borderLight}
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Income Bar */}
        <Rect
          x={width / 4 - barWidth / 2}
          y={chartHeight - incomeBarHeight}
          width={barWidth}
          height={incomeBarHeight}
          fill={Colors.income}
          rx={6}
        />
        <SvgText
          x={width / 4}
          y={chartHeight - incomeBarHeight - 8}
          fill={Colors.income}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
        >
          {currency}{income > 1000 ? `${(income / 1000).toFixed(1)}k` : income}
        </SvgText>

        {/* Expense Bar */}
        <Rect
          x={(3 * width) / 4 - barWidth / 2}
          y={chartHeight - expenseBarHeight}
          width={barWidth}
          height={expenseBarHeight}
          fill={Colors.expense}
          rx={6}
        />
        <SvgText
          x={(3 * width) / 4}
          y={chartHeight - expenseBarHeight - 8}
          fill={Colors.expense}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
        >
          {currency}{expense > 1000 ? `${(expense / 1000).toFixed(1)}k` : expense}
        </SvgText>
      </Svg>

      <View style={styles.labelsRow}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: Colors.income }]} />
          <Text style={styles.labelText}>Income</Text>
        </View>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: Colors.expense }]} />
          <Text style={styles.labelText}>Expense</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  labelText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
