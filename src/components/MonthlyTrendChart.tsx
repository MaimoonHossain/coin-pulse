import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { MonthlyTrendPoint } from '../database/transactions';

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[];
  currency: string;
  height?: number;
}

const formatK = (val: number): string => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toString();
};

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data,
  currency,
  height = 220,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  // Subtract card padding (16*2) + scroll padding (20*2)
  const svgWidth = screenWidth - 72;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No multi-month data available yet.</Text>
      </View>
    );
  }

  const chartPad = { top: 24, bottom: 36, left: 8, right: 8 };
  const chartW = svgWidth - chartPad.left - chartPad.right;
  const chartH = height - chartPad.top - chartPad.bottom;

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  const slotWidth = chartW / data.length;
  const barWidth = Math.min((slotWidth - 12) / 2, 18);
  const gap = 3;

  // 3 gridlines
  const gridVals = [0, 0.5, 1].map(f => Math.round(f * maxVal));

  return (
    <View style={styles.container}>
      <Svg width={svgWidth} height={height}>
        {/* Grid lines */}
        {gridVals.map((gv, i) => {
          const gy = chartPad.top + chartH - (gv / maxVal) * chartH;
          return (
            <G key={i}>
              <Line
                x1={chartPad.left}
                y1={gy}
                x2={svgWidth - chartPad.right}
                y2={gy}
                stroke={i === 0 ? Colors.border : Colors.borderLight}
                strokeWidth={i === 0 ? 1.5 : 1}
                strokeDasharray={i === 0 ? undefined : '4,4'}
              />
              {i > 0 && (
                <SvgText
                  x={chartPad.left}
                  y={gy - 3}
                  fill={Colors.textMuted}
                  fontSize="9"
                  textAnchor="start"
                >
                  {currency}{formatK(gv)}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Bars per month */}
        {data.map((d, i) => {
          const slotX = chartPad.left + i * slotWidth;
          const centerX = slotX + slotWidth / 2;

          const incH = (d.income / maxVal) * chartH;
          const expH = (d.expense / maxVal) * chartH;
          const baseY = chartPad.top + chartH;

          const incX = centerX - barWidth - gap / 2;
          const expX = centerX + gap / 2;

          const hasSavings = d.savings > 0;
          const savingsDotY = baseY - Math.max(incH, expH) - 8;

          return (
            <G key={d.month}>
              {/* Income bar */}
              <Rect
                x={incX}
                y={baseY - incH}
                width={barWidth}
                height={Math.max(incH, 1)}
                fill={Colors.income}
                rx={3}
                opacity={0.9}
              />
              {/* Expense bar */}
              <Rect
                x={expX}
                y={baseY - expH}
                width={barWidth}
                height={Math.max(expH, 1)}
                fill={Colors.expense}
                rx={3}
                opacity={0.9}
              />
              {/* Savings dot indicator */}
              {hasSavings && (
                <Circle
                  cx={centerX}
                  cy={savingsDotY}
                  r={3}
                  fill={Colors.income}
                  opacity={0.7}
                />
              )}
              {/* Month label */}
              <SvgText
                x={centerX}
                y={baseY + 14}
                fill={Colors.textSecondary}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.income }]} />
          <Text style={styles.legendLabel}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.expense }]} />
          <Text style={styles.legendLabel}>Expense</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDotCircle, { backgroundColor: Colors.income }]} />
          <Text style={styles.legendLabel}>Savings</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendDotCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  legendLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
