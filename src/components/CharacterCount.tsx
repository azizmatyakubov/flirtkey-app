import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkColors, fontSizes } from '../constants/theme';

interface CharacterCountProps {
  current: number;
  max?: number;
  warningThreshold?: number;
}

export const CharacterCount = React.memo(function CharacterCount({
  current,
  max = 500,
  warningThreshold = 0.9,
}: CharacterCountProps) {
  const percentage = current / max;
  const isWarning = percentage >= warningThreshold;
  const isOver = percentage >= 1;

  const getColor = () => {
    if (isOver) return darkColors.error;
    if (isWarning) return darkColors.warning;
    return darkColors.textSecondary;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: getColor() }]}>
        {current}/{max}
      </Text>
      {isOver && <Text style={styles.warning}>Message too long!</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  warning: {
    fontSize: fontSizes.xs,
    color: darkColors.error,
    marginLeft: 8,
  },
});
