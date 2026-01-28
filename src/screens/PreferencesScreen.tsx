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
import * as Haptics from 'expo-haptics';
import { useSettingsStore, ResponseTone, ResponseLength } from '../stores/settingsStore';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';

// ==========================================
// Constants
// ==========================================

const RESPONSE_TONES: { key: ResponseTone; label: string; emoji: string; description: string }[] = [
  { key: 'flirty', label: 'Flirty', emoji: '😏', description: 'Teasing and playful' },
  { key: 'casual', label: 'Casual', emoji: '😊', description: 'Relaxed and friendly' },
  { key: 'confident', label: 'Confident', emoji: '😎', description: 'Bold and assertive' },
  { key: 'romantic', label: 'Romantic', emoji: '💕', description: 'Sweet and sincere' },
  { key: 'playful', label: 'Playful', emoji: '😜', description: 'Fun and witty' },
];

const RESPONSE_LENGTHS: { key: ResponseLength; label: string; description: string }[] = [
  { key: 'short', label: 'Short', description: 'Quick, punchy responses' },
  { key: 'medium', label: 'Medium', description: 'Balanced responses' },
  { key: 'detailed', label: 'Detailed', description: 'Longer, thoughtful responses' },
];

const BOLDNESS_OPTIONS: {
  key: 'safe' | 'balanced' | 'bold';
  label: string;
  emoji: string;
  description: string;
}[] = [
  { key: 'safe', label: 'Safe', emoji: '🟢', description: 'Conservative suggestions' },
  { key: 'balanced', label: 'Balanced', emoji: '🟡', description: 'Mix of safe and bold' },
  { key: 'bold', label: 'Bold', emoji: '🔴', description: 'More daring suggestions' },
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
          backgroundColor: theme.colors.primary + '20',
          borderColor: theme.colors.primary,
        },
      ]}
      onPress={() => {
        triggerHaptic();
        setPreferences({ defaultTone: tone.key });
      }}
    >
      <Text style={styles.toneEmoji}>{tone.emoji}</Text>
      <View style={styles.toneInfo}>
        <Text
          style={[
            styles.toneLabel,
            {
              color:
                preferences.defaultTone === tone.key ? theme.colors.primary : theme.colors.text,
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
        <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
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
          backgroundColor: theme.colors.primary + '20',
          borderColor: theme.colors.primary,
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
              preferences.responseLength === length.key ? theme.colors.primary : theme.colors.text,
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

  const renderBoldnessOption = (option: {
    key: 'safe' | 'balanced' | 'bold';
    label: string;
    emoji: string;
    description: string;
  }) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.boldnessOption,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        preferences.boldnessDefault === option.key && {
          backgroundColor: theme.colors.primary + '20',
          borderColor: theme.colors.primary,
        },
      ]}
      onPress={() => {
        triggerHaptic();
        setPreferences({ boldnessDefault: option.key });
      }}
    >
      <Text style={styles.boldnessEmoji}>{option.emoji}</Text>
      <Text
        style={[
          styles.boldnessLabel,
          {
            color:
              preferences.boldnessDefault === option.key ? theme.colors.primary : theme.colors.text,
          },
        ]}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const renderPhraseList = (
    title: string,
    phrases: string[],
    onRemove: (phrase: string) => void,
    onAdd: () => void,
    emptyText: string
  ) => (
    <View style={styles.phraseSection}>
      <View style={styles.phraseSectionHeader}>
        <Text style={[styles.phraseTitle, { color: theme.colors.text }]}>{title}</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={onAdd}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
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
                <Text style={[styles.removeButton, { color: theme.colors.error }]}>✕</Text>
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
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
          onPress={onAdd}
        >
          <Text style={styles.modalButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ==========================================
  // Render
  // ==========================================

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Response Preferences</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Response Tone */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          🎭 Default Response Tone
        </Text>
        <Text style={[styles.sectionHint, { color: theme.colors.textSecondary }]}>
          Choose the default personality for AI suggestions
        </Text>
        <View style={styles.toneList}>{RESPONSE_TONES.map(renderToneOption)}</View>

        {/* Response Length */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📏 Response Length</Text>
        <View style={styles.lengthRow}>{RESPONSE_LENGTHS.map(renderLengthOption)}</View>

        {/* Boldness Default */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🎯 Default Boldness</Text>
        <View style={styles.boldnessRow}>{BOLDNESS_OPTIONS.map(renderBoldnessOption)}</View>

        {/* Toggles */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>✨ Enhancements</Text>
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
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
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
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Custom Prompt */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📝 Custom Prompt Additions
        </Text>
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
          <Text style={[styles.editIcon, { color: theme.colors.primary }]}>✏️</Text>
        </TouchableOpacity>

        {/* Blocked Phrases */}
        {renderPhraseList(
          '🚫 Blocked Phrases',
          preferences.blockedPhrases,
          removeBlockedPhrase,
          () => setShowAddBlockedModal(true),
          'No blocked phrases. Add words or phrases to avoid in suggestions.'
        )}

        {/* Favorite Phrases */}
        {renderPhraseList(
          '⭐ Favorite Phrases',
          preferences.favoritePhrases,
          removeFavoritePhrase,
          () => setShowAddFavoriteModal(true),
          'No favorite phrases. Add your go-to expressions.'
        )}

        {/* Quick Reply Templates */}
        {renderPhraseList(
          '⚡ Quick Reply Templates',
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
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSaveCustomPrompt}
          >
            <Text style={styles.modalButtonText}>Save</Text>
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
    padding: 20,
    paddingTop: 60,
  },
  back: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  toneList: {
    gap: 10,
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  toneEmoji: {
    fontSize: 24,
    marginRight: 12,
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
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lengthRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lengthOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
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
    gap: 10,
  },
  boldnessOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  boldnessEmoji: {
    fontSize: 16,
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
    borderRadius: 12,
    borderWidth: 1,
  },
  customPromptText: {
    flex: 1,
    fontSize: 14,
  },
  editIcon: {
    fontSize: 16,
  },
  phraseSection: {
    marginTop: 24,
  },
  phraseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phraseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  phraseList: {
    gap: 8,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  phraseText: {
    flex: 1,
    fontSize: 14,
  },
  removeButton: {
    fontSize: 16,
    padding: 4,
  },
  modalInput: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  modalHint: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  customPromptInput: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
