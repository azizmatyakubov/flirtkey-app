/**
 * SortMenu Component
 * Dropdown for sorting options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, accentColors, spacing, fontSizes, borderRadius } from '../constants/theme';

export type SortOption = {
  key: string;
  label: string;
  icon?: string;
};

export interface SortMenuProps {
  options: SortOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function SortMenu({ options, selectedKey, onSelect }: SortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.key === selectedKey);

  return (
    <View>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.triggerIcon}>↕️</Text>
        <Text style={styles.triggerText}>
          {selectedOption?.label || 'Sort'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.overlay}>
            <View style={styles.menu}>
              <Text style={styles.menuTitle}>Sort By</Text>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.option,
                    selectedKey === option.key && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(option.key);
                    setIsOpen(false);
                  }}
                >
                  {option.icon && (
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      selectedKey === option.key && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedKey === option.key && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    gap: spacing.xs,
  },
  triggerIcon: {
    fontSize: fontSizes.sm,
  },
  triggerText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menu: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    width: '80%',
    maxWidth: 300,
  },
  menuTitle: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
    marginBottom: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  optionSelected: {
    backgroundColor: `${darkColors.primary}20`,
  },
  optionIcon: {
    fontSize: fontSizes.md,
  },
  optionText: {
    flex: 1,
    color: darkColors.text,
    fontSize: fontSizes.md,
  },
  optionTextSelected: {
    color: darkColors.primary,
    fontWeight: '600',
  },
  checkmark: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
});

export default SortMenu;
