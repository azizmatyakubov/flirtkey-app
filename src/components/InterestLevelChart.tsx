// 6.3.7 Show level chart over time
import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';
import { ConversationEntry } from '../stores/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InterestLevelChartProps {
  history: ConversationEntry[];
  maxPoints?: number;
  height?: number;
  showLabels?: boolean;
}

export const InterestLevelChart = memo(function InterestLevelChart({
  history,
  maxPoints = 10,
  height = 150,
  showLabels = true,
}: InterestLevelChartProps) {
  // Filter entries with interest levels and take the most recent ones
  const dataPoints = history
    .filter((entry) => entry.interestLevel !== undefined)
    .slice(0, maxPoints)
    .reverse(); // Oldest first for the chart

  if (dataPoints.length < 2) {
    return (
      <View style={[styles.container, { minHeight: height }]}>
        <Text style={styles.noDataText}>📊 Need at least 2 conversations to show trends</Text>
      </View>
    );
  }

  const chartWidth = SCREEN_WIDTH - spacing.lg * 4;
  const chartHeight = height - spacing.xl;
  const barWidth = Math.min(30, (chartWidth - spacing.md * 2) / dataPoints.length - 4);

  // Get trend
  const firstLevel = dataPoints[0]?.interestLevel ?? 50;
  const lastLevel = dataPoints[dataPoints.length - 1]?.interestLevel ?? 50;
  const trend = lastLevel - firstLevel;
  const trendColor =
    trend > 5 ? darkColors.safe : trend < -5 ? darkColors.bold : darkColors.balanced;
  const trendEmoji = trend > 5 ? '📈' : trend < -5 ? '📉' : '➡️';

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getBarColor = (level: number) => {
    if (level > 70) return darkColors.safe;
    if (level > 40) return darkColors.balanced;
    return darkColors.bold;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Interest Level Trend</Text>
        <View style={styles.trendBadge}>
          <Text style={styles.trendEmoji}>{trendEmoji}</Text>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trend > 0 ? '+' : ''}
            {trend}%
          </Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        {/* Grid lines */}
        <View style={styles.gridLines}>
          {[100, 75, 50, 25, 0].map((level) => (
            <View key={level} style={styles.gridLine}>
              {showLabels && <Text style={styles.gridLabel}>{level}%</Text>}
            </View>
          ))}
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {dataPoints.map((entry, index) => {
            const level = entry.interestLevel ?? 50;
            const barHeight = (level / 100) * (chartHeight - 20);

            return (
              <Animated.View
                key={entry.id}
                entering={FadeIn.delay(index * 100)}
                style={styles.barWrapper}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      width: barWidth,
                      backgroundColor: getBarColor(level),
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{level}</Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      {showLabels &&
        dataPoints.length > 0 &&
        (() => {
          const firstPoint = dataPoints[0];
          const lastPoint = dataPoints[dataPoints.length - 1];
          if (!firstPoint || !lastPoint) return null;
          return (
            <View style={styles.xAxis}>
              <Text style={styles.xLabel}>{formatDate(firstPoint.timestamp)}</Text>
              <Text style={styles.xLabel}>{formatDate(lastPoint.timestamp)}</Text>
            </View>
          );
        })()}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {Math.min(...dataPoints.map((d) => d.interestLevel ?? 0))}%
          </Text>
          <Text style={styles.statLabel}>Low</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {Math.round(
              dataPoints.reduce((sum, d) => sum + (d.interestLevel ?? 0), 0) / dataPoints.length
            )}
            %
          </Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {Math.max(...dataPoints.map((d) => d.interestLevel ?? 0))}%
          </Text>
          <Text style={styles.statLabel}>High</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{dataPoints.length}</Text>
          <Text style={styles.statLabel}>Chats</Text>
        </View>
      </View>
    </View>
  );
});

InterestLevelChart.displayName = 'InterestLevelChart';

// Mini chart for compact display
interface MiniChartProps {
  history: ConversationEntry[];
  width?: number;
  height?: number;
}

export const MiniInterestChart = memo(function MiniInterestChart({ history, width = 80, height = 30 }: MiniChartProps) {
  const dataPoints = history
    .filter((entry) => entry.interestLevel !== undefined)
    .slice(0, 7)
    .reverse();

  if (dataPoints.length < 2) {
    return <View style={[styles.miniContainer, { width, height }]} />;
  }

  const barWidth = Math.max(4, (width - 8) / dataPoints.length - 2);

  const getBarColor = (level: number) => {
    if (level > 70) return darkColors.safe;
    if (level > 40) return darkColors.balanced;
    return darkColors.bold;
  };

  return (
    <View style={[styles.miniContainer, { width, height }]}>
      <View style={styles.miniBars}>
        {dataPoints.map((entry, index) => {
          const level = entry.interestLevel ?? 50;
          const barHeight = (level / 100) * (height - 4);

          return (
            <View
              key={index}
              style={[
                styles.miniBar,
                {
                  height: barHeight,
                  width: barWidth,
                  backgroundColor: getBarColor(level),
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
});

MiniInterestChart.displayName = 'MiniInterestChart';

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.background,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  trendEmoji: {
    fontSize: fontSizes.sm,
    marginRight: spacing.xs,
  },
  trendText: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
  },
  chartContainer: {
    position: 'relative',
    marginVertical: spacing.sm,
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 20,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: darkColors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    color: darkColors.textSecondary,
    fontSize: 10,
    marginLeft: -25,
    width: 25,
    textAlign: 'right',
    paddingRight: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingLeft: 30,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    color: darkColors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  xLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
  statLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  noDataText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  // Mini chart styles
  miniContainer: {
    overflow: 'hidden',
  },
  miniBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 2,
  },
  miniBar: {
    borderRadius: 2,
    minHeight: 2,
  },
});
