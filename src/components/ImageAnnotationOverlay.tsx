/**
 * ImageAnnotationOverlay Component (7.3.7)
 *
 * Provides visual annotations on screenshot images:
 * - Highlight key messages
 * - Mark interest indicators
 * - Show conversation flow arrows
 * - Add point markers for notable items
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// SVG imports - requires react-native-svg package
// These are used for the overlay annotations
import Svg, { Rect, Path, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { darkColors, accentColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import type { AnalysisResult } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// Types
// ==========================================

export interface AnnotationPoint {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  type: 'highlight' | 'warning' | 'interest' | 'tip' | 'message';
  label?: string;
  color?: string;
}

export interface AnnotationRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'her-message' | 'your-message' | 'key-point' | 'warning';
  label?: string;
}

export interface ImageAnnotationOverlayProps {
  imageWidth: number;
  imageHeight: number;
  containerWidth?: number;
  containerHeight?: number;
  points?: AnnotationPoint[];
  regions?: AnnotationRegion[];
  analysisResult?: AnalysisResult;
  showInterestLevel?: boolean;
  showKeyPoints?: boolean;
  animated?: boolean;
}

// ==========================================
// Helper Functions
// ==========================================

function getAnnotationColor(type: string): string {
  switch (type) {
    case 'highlight':
    case 'interest':
      return darkColors.success;
    case 'warning':
      return darkColors.error;
    case 'tip':
      return darkColors.primary;
    case 'her-message':
      return '#FF6B9D'; // Pink for her
    case 'your-message':
      return accentColors.gradientPurple; // Purple for you
    case 'key-point':
      return darkColors.warning;
    default:
      return darkColors.primary;
  }
}

function generateAnnotationsFromAnalysis(result: AnalysisResult): {
  points: AnnotationPoint[];
  regions: AnnotationRegion[];
} {
  const points: AnnotationPoint[] = [];
  const regions: AnnotationRegion[] = [];

  // Add interest level indicator
  if (result.interestLevel !== undefined) {
    const interestType =
      result.interestLevel >= 70 ? 'interest' : result.interestLevel >= 40 ? 'tip' : 'warning';
    points.push({
      x: 90,
      y: 10,
      type: interestType,
      label: `${result.interestLevel}%`,
    });
  }

  // Add key areas based on pro tip
  if (result.proTip) {
    regions.push({
      x: 10,
      y: 20,
      width: 80,
      height: 15,
      type: 'key-point',
      label: 'Key Area',
    });
  }

  // Add markers for suggestions
  result.suggestions.forEach((suggestion, index) => {
    const type =
      suggestion.type === 'safe' ? 'tip' : suggestion.type === 'bold' ? 'warning' : 'highlight';
    points.push({
      x: 85,
      y: 30 + index * 15,
      type,
      label: suggestion.type.charAt(0).toUpperCase(),
    });
  });

  return { points, regions };
}

// ==========================================
// Animated Marker Component
// ==========================================

interface AnimatedMarkerProps {
  x: number;
  y: number;
  color: string;
  label?: string;
  delay?: number;
}

function AnimatedMarker({ x, y, color, label, delay = 0 }: AnimatedMarkerProps) {
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    pulseOpacity.value = withDelay(
      delay,
      withRepeat(withTiming(0.5, { duration: 1000 }), -1, true)
    );
  }, [delay, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: 1 + (1 - pulseOpacity.value) * 0.3 }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.markerContainer, { left: `${x}%`, top: `${y}%` }]}
    >
      {/* Pulse ring */}
      <Animated.View style={[styles.pulseRing, { borderColor: color }, pulseStyle]} />

      {/* Main marker */}
      <View style={[styles.marker, { backgroundColor: color }]}>
        {label && <Text style={styles.markerLabel}>{label}</Text>}
      </View>
    </Animated.View>
  );
}

// ==========================================
// Main Component
// ==========================================

export function ImageAnnotationOverlay({
  imageWidth,
  imageHeight,
  containerWidth = SCREEN_WIDTH - spacing.lg * 2,
  containerHeight = 400,
  points = [],
  regions = [],
  analysisResult,
  showInterestLevel = true,
  showKeyPoints = true,
  animated = true,
}: ImageAnnotationOverlayProps) {
  // Generate annotations from analysis result if provided
  const generatedAnnotations = useMemo(() => {
    if (analysisResult) {
      return generateAnnotationsFromAnalysis(analysisResult);
    }
    return { points: [], regions: [] };
  }, [analysisResult]);

  // Combine provided and generated annotations
  const allPoints = [...points, ...generatedAnnotations.points];
  const allRegions = [...regions, ...generatedAnnotations.regions];

  // Scale factors available for future image-relative positioning
  // Usage: const scaledX = (point.x / 100) * containerWidth * scaleX;
  void (containerWidth / imageWidth); // scaleX
  void (containerHeight / imageHeight); // scaleY

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {/* SVG Overlay for regions and lines */}
      <Svg
        style={styles.svgOverlay}
        width={containerWidth}
        height={containerHeight}
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      >
        <Defs>
          <LinearGradient id="highlightGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={darkColors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={darkColors.primary} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Render regions */}
        {allRegions.map((region, index) => {
          const color = getAnnotationColor(region.type);
          const rectX = (region.x / 100) * containerWidth;
          const rectY = (region.y / 100) * containerHeight;
          const rectWidth = (region.width / 100) * containerWidth;
          const rectHeight = (region.height / 100) * containerHeight;

          return (
            <React.Fragment key={`region-${index}`}>
              {/* Region rectangle */}
              <Rect
                x={rectX}
                y={rectY}
                width={rectWidth}
                height={rectHeight}
                fill={`${color}20`}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5,5"
                rx={8}
              />

              {/* Region label */}
              {region.label && (
                <SvgText x={rectX + 8} y={rectY - 5} fill={color} fontSize={11} fontWeight="600">
                  {region.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* Connection lines between points */}
        {allPoints.length > 1 && showKeyPoints && (
          <Path
            d={allPoints
              .map((p, i) => {
                const x = (p.x / 100) * containerWidth;
                const y = (p.y / 100) * containerHeight;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ')}
            stroke={darkColors.primary}
            strokeWidth={1}
            strokeDasharray="3,3"
            fill="none"
            opacity={0.5}
          />
        )}
      </Svg>

      {/* Animated point markers */}
      {allPoints.map((point, index) => (
        <AnimatedMarker
          key={`point-${index}`}
          x={point.x}
          y={point.y}
          color={point.color || getAnnotationColor(point.type)}
          label={point.label}
          delay={animated ? index * 100 : 0}
        />
      ))}

      {/* Interest level badge */}
      {showInterestLevel && analysisResult?.interestLevel !== undefined && (
        <Animated.View entering={FadeIn.delay(300)} style={styles.interestBadge}>
          <Text style={styles.interestBadgeText}>Interest: {analysisResult.interestLevel}%</Text>
        </Animated.View>
      )}

      {/* Legend */}
      {(allPoints.length > 0 || allRegions.length > 0) && (
        <Animated.View entering={FadeIn.delay(500)} style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: darkColors.success }]} />
            <Text style={styles.legendText}>Interest</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: darkColors.warning }]} />
            <Text style={styles.legendText}>Notice</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: darkColors.error }]} />
            <Text style={styles.legendText}>Careful</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -15,
    marginTop: -15,
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  interestBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: darkColors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  interestBadgeText: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: darkColors.text,
    fontSize: 10,
  },
});

export default ImageAnnotationOverlay;
