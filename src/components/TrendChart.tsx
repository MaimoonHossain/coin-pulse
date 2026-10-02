import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { DailyTrend } from '../types';

interface TrendChartProps {
  data: DailyTrend[];
  currency: string;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  currency,
  height = 140,
}) => {
  if (!data || data.length < 2) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Add more daily transactions to view trend flow</Text>
      </View>
    );
  }

  const width = 300;
  const padding = 20;
  const chartW = width - padding * 2;
  const chartH = height - 40;

  const maxVal = Math.max(...data.map(d => Math.max(d.expense, d.income)), 500);

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartW;
    const yExp = chartH - (d.expense / maxVal) * chartH + 10;
    return { x, yExp, date: d.formatted_date, expense: d.expense };
  });

  // Construct SVG Path D string
  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.yExp}` : `${acc} L ${pt.x} ${pt.yExp}`;
  }, '');

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Baseline grid */}
        <Line
          x1={padding}
          y1={chartH + 10}
          x2={width - padding}
          y2={chartH + 10}
          stroke={Colors.border}
          strokeWidth="1"
        />

        {/* Expense Trend Line */}
        <Path d={pathD} stroke={Colors.expense} strokeWidth="3" fill="none" />

        {/* Data points */}
        {points.map((pt, i) => (
          <Circle
            key={i}
            cx={pt.x}
            cy={pt.yExp}
            r="4"
            fill={Colors.bg}
            stroke={Colors.expense}
            strokeWidth="2"
          />
        ))}
      </Svg>

      <View style={styles.xAxis}>
        <Text style={styles.xText}>{data[0]?.formatted_date}</Text>
        <Text style={styles.xText}>
          {data[Math.floor(data.length / 2)]?.formatted_date}
        </Text>
        <Text style={styles.xText}>{data[data.length - 1]?.formatted_date}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    padding: 16,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 260,
    marginTop: 4,
  },
  xText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});
