import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { CategoryAggregate } from '../types';

interface DonutChartProps {
  data: CategoryAggregate[];
  currency: string;
  totalExpense: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  currency,
  totalExpense,
  size = 200,
}) => {
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  if (!data || data.length === 0 || totalExpense === 0) {
    return (
      <View style={[styles.emptyContainer, { height: size + 20 }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <View style={styles.centerTextContainer}>
          <Text style={styles.emptyText}>No Expense</Text>
          <Text style={styles.subText}>Data yet</Text>
        </View>
      </View>
    );
  }

  let accumulatedAngle = 0;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {data.map((item, index) => {
              const strokeDashoffset = circumference - (circumference * item.percentage) / 100;
              const angle = (item.percentage / 100) * 360;
              const currentAngle = accumulatedAngle;
              accumulatedAngle += angle;

              return (
                <Circle
                  key={item.category_id || index}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={item.category_color || Colors.primary}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  rotation={currentAngle}
                  origin={`${center}, ${center}`}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>

        <View style={styles.centerTextContainer}>
          <Text style={styles.centerLabel}>Total Spent</Text>
          <Text style={styles.centerValue}>
            {currency}{totalExpense.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Dynamic Category Legend */}
      <View style={styles.legendContainer}>
        {data.slice(0, 6).map((item) => (
          <View key={item.category_id} style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: item.category_color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {item.category_name}
            </Text>
            <Text style={styles.legendPercent}>{item.percentage}%</Text>
            <Text style={styles.legendAmount}>
              {currency}{item.total_amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  centerValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  subText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  legendContainer: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  legendPercent: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },
  legendAmount: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
