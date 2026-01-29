import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSettingsStore, ResponseTone, ResponseLength } from '../stores/settingsStore';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';
import { darkColors, accentColors, spacing, fontSizes, borderRadius } from '../constants/theme';

// ==========================================
// Constants
// ==========================================

const RESPONSE_TONES: { key: ResponseTone; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { key: 'flirty', label: 'Flirty', icon: 'flame' as any, description: 'Teasing and playful' },
  { key: 'casual', label: 'Casual', icon: 'happy' as any, description: 'Relaxed and friendly' },
  { key: 'confident', label: 'Confident', icon: 'shield-checkmark' as any, description: 'Bold and assertive' },
  { key: 'romantic', label: 'Romantic', icon: 'heart' as any, description: 'Sweet and sincere' },
  { key: 'playful', label: 'Playful', icon: 'game-controller' as any, description: 'Fun and witty' },
];

const RESPONSE_LENGTHS: { key: ResponseLength; label: string; description: string }[] = [
  { key: 'short', label: 'Short', description: 'Quick, punchy responses' },
  { key: 'medium', label: 'Medium', description: 'Balanced responses' },
  { key: 'detailed', label: 'Detailed', description: 'Longer, thoughtful responses' },
];

const BOLDNESS_OPTIONS: {
  key: 'safe' | 'balanced' | 'bold';
  label: string;
  color: string;
  description: string;
}[] = [
  { key: 'safe', label: 'Safe', color: darkColors.safe, description: 'Conservative suggestions' },
  { key: 'balanced', label: 'Balanced', color: darkColors.balanced, description: 'Mix of safe and bold' },
  { key: 'bold', label: 'Bold', color: darkColors.bold, description: 'More daring suggestions' },
];

// ==========================================
// Component
// ==========================================

export function PreferencesScreen({ navigation }: any) {
  const {
    preferences,
    setPreferences,
    addBlockedPhrase,
    removeBlockedPhrase,
    addFavoritePhrase,
    removeFavoritePhrase,
    addQuickReply,
    removeQuickReply,
    accessibility,
  } = useSettingsStore();
  const { theme } = useTheme();

  const [showAddBlockedModal, setShowAddBlockedModal] = useState(false);
  const [showAddFavoriteModal, setShowAddFavoriteModal] = useState(false);
  const [showAddQuickReplyModal, setShowAddQuickReplyModal] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [customPrompt, setCustomPrompt] = useState(preferences.customPromptAdditions);

  const triggerHaptic = () => {
    if (accessibility.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleAddBlocked = () => {
    if (newPhrase.trim()) {
      addBlockedPhrase(newPhrase.trim());
      setNewPhrase('');
      setShowAddBlockedModal(false);
      triggerHaptic();
    }
  };

  const handleAddFavorite = () => {
    if (newPhrase.trim()) {
      addFavoritePhrase(newPhrase.trim());
      setNewPhrase('');
      setShowAddFavoriteModal(false);
      triggerHaptic();
    }
  };

  const handleAddQuickReply = () => {
    if (newPhrase.trim()) {
      addQuickReply(newPhrase.trim());
      setNewPhrase('');
      setShowAddQuickReplyModal(false);
      triggerHaptic();
    }
  };

  const handleSaveCustomPrompt = () => {
    setPreferences({ customPromptAdditions: customPrompt });
    setShowCustomPromptModal(false);
    Alert.alert('Saved', 'Custom prompt additions saved');
    triggerHaptic();
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const renderToneOption = (tone: (typeof RESPONSE_TONES)[0]) => (
    <TouchableOpacity
      key={tone.key}
      style={[
        styles.toneOption,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        preferences.defaultTone === tone.key && {
          backgroundColor: `${accentColors.coral}15`,
          borderColor: accentColors.coral,
        },
      ]}
      onPress={() => {
        triggerHaptic();
        setPreferences({ defaultTone: tone.key });
      }}
    >
      <View style={[styles.toneIconContainer, preferences.defaultTone === tone.key && { backgroundColor: `${accentColors.coral}20` }]}>
        <Ionicons
          name={tone.icon as any}
          size={22}
          color={preferences.defaultTone === tone.key ? accentColors.coral : theme.colors.textSecondary}
        />
      </View>
      <View style={styles.toneInfo}>
        <Text
          style={[
            styles.toneLabel,
            {
              color:
                preferences.defaultTone === tone.key ? accentColors.coral : theme.colors.text,
            },
          ]}
        >
          {tone.label}
        </Text>
        <Text style={[styles.toneDesc, { color: theme.colors.textSecondary }]}>
          {tone.description}
        </Text>
      </View>
      {preferences.defaultTone === tone.key && (
        <Ionicons name="checkmark-circle" size={22} color={accentColors.coral} />
      )}
    </TouchableOpacity>
  );

  const renderLengthOption = (length: (typeof RESPONSE_LENGTHS)[0]) => (
    <TouchableOpacity
      key={length.key}
      style={[
        styles.lengthOption,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        preferences.responseLength === length.key && {
          backgroundColor: `${accentColors.coral}15`,
          borderColor: accentColors.coral,
        },
      ]}
      onPress={() => {
        triggerHaptic();
        setPreferences({ responseLength: length.key });
      }}
    >
      <Text
        style={[
          styles.lengthLabel,
          {
            color:
              preferences.responseLength === length.key ? accentColors.coral : theme.colors.text,
          },
        ]}
      >
        {length.label}
      </Text>
      <Text style={[styles.lengthDesc, { color: theme.colors.textSecondary }]}>
        {length.description}
      </Text>
    </TouchableOpacity>
  );

  const renderBoldnessOption = (option: (typeof BOLDNESS_OPTIONS)[0]) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.boldnessOption,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        preferences.boldnessDefault === option.key && {
          backgroundColor: `${option.color}15`,
          borderColor: option.color,
        },
      ]}
      onPress={() => {
        triggerHaptic();
        setPreferences({ boldnessDefault: option.key });
      }}
    >
      <View style={[styles.boldnessDot, { backgroundColor: option.color }]} />
      <Text
        style={[
          styles.boldnessLabel,
          {
            color:
              preferences.boldnessDefault === option.key ? option.color : theme.colors.text,
          },
        ]}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const renderPhraseList = (
    title: string,
    iconName: keyof typeof Ionicons.glyphMap,
    phrases: string[],
    onRemove: (phrase: string) => void,
    onAdd: () => void,
    emptyText: string
  ) => (
    <View style={styles.phraseSection}>
      <View style={styles.phraseSectionHeader}>
        <View style={styles.phraseTitleRow}>
          <Ionicons name={iconName as any} size={18} color={accentColors.coral} />
          <Text style={[styles.phraseTitle, { color: theme.colors.text }]}>{title}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
        >
          <LinearGradient
            colors={[accentColors.gradientStart, accentColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {phrases.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{emptyText}</Text>
      ) : (
        <View style={styles.phraseList}>
          {phrases.map((phrase, index) => (
            <View
              key={index}
              style={[
                styles.phraseItem,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.phraseText, { color: theme.colors.text }]} numberOfLines={1}>
                {phrase}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic();
                  onRemove(phrase);
                }}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderAddModal = (
    visible: boolean,
    title: string,
    placeholder: string,
    onClose: () => void,
    onAdd: () => void
  ) => (
    <Modal visible={visible} onClose={onClose} title={title}>
      <TextInput
        style={[
          styles.modalInput,
          {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={newPhrase}
        onChangeText={setNewPhrase}
        autoFocus
      />
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: theme.colors.surface }]}
          onPress={onClose}
        >
          <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAdd}>
          <LinearGradient
            colors={[accentColors.gradientStart, accentColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalButton}
          >
            <Text style={styles.modalButtonText}>Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ==========================================
  // Render
  // ==========================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Response Preferences</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Response Tone */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="color-palette" size={20} color={accentColors.coral} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Default Response Tone</Text>
        </View>
        <Text style={[styles.sectionHint, { color: theme.colors.textSecondary }]}>
          Choose the default personality for AI suggestions
        </Text>
        <View style={styles.toneList}>{RESPONSE_TONES.map(renderToneOption)}</View>

        {/* Response Length */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="resize" size={20} color={accentColors.coral} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Response Length</Text>
        </View>
        <View style={styles.lengthRow}>{RESPONSE_LENGTHS.map(renderLengthOption)}</View>

        {/* Boldness Default */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="speedometer" size={20} color={accentColors.coral} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Default Boldness</Text>
        </View>
        <View style={styles.boldnessRow}>{BOLDNESS_OPTIONS.map(renderBoldnessOption)}</View>

        {/* Toggles */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="sparkles" size={20} color={accentColors.coral} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Enhancements</Text>
        </View>
        <View style={[styles.toggleRow, { borderBottomColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Emoji Usage</Text>
            <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>
              Include emojis in suggestions
            </Text>
          </View>
          <Switch
            value={preferences.emojiUsage}
            onValueChange={(val) => {
              triggerHaptic();
              setPreferences({ emojiUsage: val });
            }}
            trackColor={{ false: theme.colors.border, true: accentColors.coral }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.toggleRow, { borderBottomColor: theme.colors.border }]}>
          <View>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>GIF Suggestions</Text>
            <Text style={[styles.toggleHint, { color: theme.colors.textSecondary }]}>
              Suggest GIFs when appropriate
            </Text>
          </View>
          <Switch
            value={preferences.gifSuggestions}
            onValueChange={(val) => {
              triggerHaptic();
              setPreferences({ gifSuggestions: val });
            }}
            trackColor={{ false: theme.colors.border, true: accentColors.coral }}
            thumbColor="#fff"
          />
        </View>

        {/* Custom Prompt */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="create" size={20} color={accentColors.coral} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Custom Prompt Additions</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.customPromptButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => setShowCustomPromptModal(true)}
        >
          <Text
            style={[
              styles.customPromptText,
              {
                color: preferences.customPromptAdditions
                  ? theme.colors.text
                  : theme.colors.textSecondary,
              },
            ]}
            numberOfLines={2}
          >
            {preferences.customPromptAdditions || 'Add custom instructions for AI...'}
          </Text>
          <Ionicons name="pencil" size={18} color={accentColors.coral} />
        </TouchableOpacity>

        {/* Blocked Phrases */}
        {renderPhraseList(
          'Blocked Phrases',
          'ban' as any,
          preferences.blockedPhrases,
          removeBlockedPhrase,
          () => setShowAddBlockedModal(true),
          'No blocked phrases. Add words or phrases to avoid in suggestions.'
        )}

        {/* Favorite Phrases */}
        {renderPhraseList(
          'Favorite Phrases',
          'star' as any,
          preferences.favoritePhrases,
          removeFavoritePhrase,
          () => setShowAddFavoriteModal(true),
          'No favorite phrases. Add your go-to expressions.'
        )}

        {/* Quick Reply Templates */}
        {renderPhraseList(
          'Quick Reply Templates',
          'flash' as any,
          preferences.quickReplyTemplates,
          removeQuickReply,
          () => setShowAddQuickReplyModal(true),
          'No quick replies. Add templates for fast responses.'
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Modals */}
      {renderAddModal(
        showAddBlockedModal,
        'Add Blocked Phrase',
        'Enter phrase to block...',
        () => setShowAddBlockedModal(false),
        handleAddBlocked
      )}

      {renderAddModal(
        showAddFavoriteModal,
        'Add Favorite Phrase',
        'Enter your favorite phrase...',
        () => setShowAddFavoriteModal(false),
        handleAddFavorite
      )}

      {renderAddModal(
        showAddQuickReplyModal,
        'Add Quick Reply',
        'Enter quick reply template...',
        () => setShowAddQuickReplyModal(false),
        handleAddQuickReply
      )}

      {/* Custom Prompt Modal */}
      <Modal
        visible={showCustomPromptModal}
        onClose={() => setShowCustomPromptModal(false)}
        title="Custom Prompt Additions"
      >
        <Text style={[styles.modalHint, { color: theme.colors.textSecondary }]}>
          Add custom instructions that will be included in every AI prompt. For example: "Always be
          respectful" or "Include humor when possible"
        </Text>
        <TextInput
          style={[
            styles.customPromptInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Enter custom instructions..."
          placeholderTextColor={theme.colors.textSecondary}
          value={customPrompt}
          onChangeText={setCustomPrompt}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
              setCustomPrompt(preferences.customPromptAdditions);
              setShowCustomPromptModal(false);
            }}
          >
            <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSaveCustomPrompt}>
            <LinearGradient
              colors={[accentColors.gradientStart, accentColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
  },
  toneList: {
    gap: spacing.sm,
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  toneIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: `${darkColors.textTertiary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  toneInfo: {
    flex: 1,
  },
  toneLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toneDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lengthOption: {
    flex: 1,
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  lengthLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  lengthDesc: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  boldnessRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  boldnessOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  boldnessDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  boldnessLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    fontSize: 15,
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
  customPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  customPromptText: {
    flex: 1,
    fontSize: 14,
  },
  phraseSection: {
    marginTop: spacing.lg,
  },
  phraseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  phraseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phraseTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
  },
  phraseList: {
    gap: spacing.sm,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  phraseText: {
    flex: 1,
    fontSize: 14,
  },
  modalInput: {
    padding: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: 15,
  },
  modalHint: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  customPromptInput: {
    padding: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
