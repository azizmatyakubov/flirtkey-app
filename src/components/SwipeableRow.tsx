/**
 * SwipeableRow Component
 * Swipeable row with delete action
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { darkColors, fontSizes } from '../constants/theme';

const ACTION_WIDTH = 80;

export interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  enabled?: boolean;
}

export function SwipeableRow({
  children,
  onDelete,
  onEdit,
  enabled = true,
}: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const actions = [];

    if (onEdit) {
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [ACTION_WIDTH * 2, 0],
      });

      actions.push(
        <Animated.View
          key="edit"
          style={[styles.actionContainer, { transform: [{ translateX }] }]}
        >
          <TouchableOpacity
            style={[styles.action, styles.editAction]}
            onPress={() => {
              swipeableRef.current?.close();
              onEdit();
            }}
          >
            <Ionicons name="create-outline" size={20} color="#ffffff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (onDelete) {
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [ACTION_WIDTH, 0],
      });

      actions.push(
        <Animated.View
          key="delete"
          style={[styles.actionContainer, { transform: [{ translateX }] }]}
        >
          <TouchableOpacity
            style={[styles.action, styles.deleteAction]}
            onPress={() => {
              swipeableRef.current?.close();
              onDelete();
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return <View style={styles.actionsRow}>{actions}</View>;
  };

  if (!enabled || (!onDelete && !onEdit)) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
  },
  actionContainer: {
    width: ACTION_WIDTH,
  },
  action: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAction: {
    backgroundColor: darkColors.primary,
  },
  deleteAction: {
    backgroundColor: darkColors.error,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    color: '#ffffff',
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});

export default SwipeableRow;
