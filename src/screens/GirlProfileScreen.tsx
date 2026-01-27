/**
 * GirlProfileScreen
 * Edit girl profile with change detection, completeness indicator, and conversation history
 * Tasks: 4.3.10-4.3.15
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useStore } from '../stores/useStore';
import { RelationshipStage } from '../types';
import { TextInput } from '../components/TextInput';
import { Select } from '../components/Select';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { DeleteDialog, UnsavedChangesDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useImagePicker } from '../hooks/useImagePicker';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

const STAGES: { key: RelationshipStage; label: string; emoji: string }[] = [
  { key: 'just_met', label: 'Just Met', emoji: '🆕' },
  { key: 'talking', label: 'Talking', emoji: '💬' },
  { key: 'flirting', label: 'Flirting', emoji: '😏' },
  { key: 'dating', label: 'Dating', emoji: '❤️' },
  { key: 'serious', label: 'Serious', emoji: '💑' },
];

// Field suggestions for empty fields (4.3.13)
const FIELD_SUGGESTIONS: Record<string, string[]> = {
  personality: ['Shy', 'Outgoing', 'Funny', 'Sarcastic', 'Intellectual', 'Adventurous'],
  interests: ['Travel', 'Music', 'Movies', 'Fitness', 'Reading', 'Art', 'Food', 'Gaming'],
  greenLights: ['Compliments', 'Deep conversations', 'Humor', 'Spontaneity'],
  redFlags: ['Being too pushy', 'Ex talk', 'Sensitive topics'],
};

interface FormState {
  personality: string;
  interests: string;
  greenLights: string;
  redFlags: string;
  insideJokes: string;
  stage: RelationshipStage;
  avatar?: string;
}

export function GirlProfileScreen({ navigation }: any) {
  const { selectedGirl, updateGirl, deleteGirl, getConversationsForGirl } = useStore();
  const { showToast } = useToast();
  const { pickFromLibrary } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
  });

  // Original values for change detection (4.3.10)
  const originalValues = useMemo(
    () => ({
      personality: selectedGirl?.personality || '',
      interests: selectedGirl?.interests || '',
      greenLights: selectedGirl?.greenLights || '',
      redFlags: selectedGirl?.redFlags || '',
      insideJokes: selectedGirl?.insideJokes || '',
      stage: selectedGirl?.relationshipStage || 'just_met',
      avatar: selectedGirl?.avatar,
    }),
    [selectedGirl]
  );

  // Form state
  const [form, setForm] = useState<FormState>(originalValues);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get conversation history (4.3.14)
  const conversations = useMemo(() => {
    if (!selectedGirl) return [];
    return getConversationsForGirl(selectedGirl.id);
  }, [selectedGirl, getConversationsForGirl]);

  // Change detection (4.3.10)
  const hasChanges = useMemo(() => {
    return (
      form.personality !== originalValues.personality ||
      form.interests !== originalValues.interests ||
      form.greenLights !== originalValues.greenLights ||
      form.redFlags !== originalValues.redFlags ||
      form.insideJokes !== originalValues.insideJokes ||
      form.stage !== originalValues.stage ||
      form.avatar !== originalValues.avatar
    );
  }, [form, originalValues]);

  // Profile completeness indicator (4.3.12)
  const completeness = useMemo(() => {
    if (!selectedGirl) return { score: 0, fields: [] };

    const fields = [
      { name: 'Personality', filled: !!form.personality },
      { name: 'Interests', filled: !!form.interests },
      { name: 'Green Lights', filled: !!form.greenLights },
      { name: 'Red Flags', filled: !!form.redFlags },
      { name: 'Inside Jokes', filled: !!form.insideJokes },
    ];

    const filledCount = fields.filter((f) => f.filled).length;
    const score = Math.round((filledCount / fields.length) * 100);

    return { score, fields, filledCount, totalFields: fields.length };
  }, [form, selectedGirl]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Handle photo selection
  const handleSelectPhoto = async () => {
    const result = await pickFromLibrary();
    if (result?.uri) {
      updateField('avatar', result.uri);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedGirl) return;

    setIsSaving(true);
    try {
      updateGirl(selectedGirl.id, {
        personality: form.personality || undefined,
        interests: form.interests || undefined,
        greenLights: form.greenLights || undefined,
        redFlags: form.redFlags || undefined,
        insideJokes: form.insideJokes || undefined,
        relationshipStage: form.stage,
        avatar: form.avatar,
      });

      showToast({
        message: 'Profile updated! ✨',
        type: 'success',
      });

      navigation.goBack();
    } catch (error) {
      showToast({
        message: 'Failed to save changes',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel with confirmation (4.3.11)
  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      navigation.goBack();
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedGirl) return;
    deleteGirl(selectedGirl.id);
    showToast({
      message: `${selectedGirl.name} removed`,
      type: 'success',
    });
    navigation.navigate('Home');
  };

  // Add suggestion to field
  const addSuggestion = (field: keyof typeof FIELD_SUGGESTIONS, suggestion: string) => {
    const currentValue = form[field as keyof FormState] as string;
    const newValue = currentValue ? `${currentValue}, ${suggestion}` : suggestion;
    updateField(field as keyof FormState, newValue);
  };

  if (!selectedGirl) {
    return (
      <View style={styles.container}>
        <Text style={styles.noGirl}>No profile selected</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedGirl.name}</Text>
        <TouchableOpacity onPress={handleSave} disabled={!hasChanges || isSaving}>
          <Text style={[styles.save, (!hasChanges || isSaving) && styles.saveDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo & Completeness */}
        <View style={styles.profileSection}>
          <Avatar
            name={selectedGirl.name}
            imageUri={form.avatar}
            size="xl"
            onPress={handleSelectPhoto}
            showEditBadge
          />

          {/* Completeness Indicator (4.3.12) */}
          <View style={styles.completenessContainer}>
            <View style={styles.completenessHeader}>
              <Text style={styles.completenessLabel}>Profile Completeness</Text>
              <Text style={styles.completenessScore}>{completeness.score}%</Text>
            </View>
            <View style={styles.completenessBar}>
              <View
                style={[
                  styles.completenessProgress,
                  { width: `${completeness.score}%` },
                  completeness.score === 100 && styles.completenessComplete,
                ]}
              />
            </View>
            <Text style={styles.completenessHint}>
              {completeness.filledCount}/{completeness.totalFields} fields filled
            </Text>
          </View>
        </View>

        {/* Stage */}
        <Select
          label="📈 Relationship Stage"
          value={form.stage}
          options={STAGES}
          onChange={(value) => updateField('stage', value)}
        />

        {/* Personality with suggestions (4.3.13) */}
        <TextInput
          label="🎭 Her Personality"
          value={form.personality}
          onChangeText={(value) => updateField('personality', value)}
          placeholder="shy, outgoing, funny, sarcastic..."
          multiline
          maxLength={500}
          showCharCount
        />
        {!form.personality && (
          <View style={styles.suggestions}>
            {FIELD_SUGGESTIONS['personality']?.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => addSuggestion('personality', s)}
              >
                <Text style={styles.suggestionText}>+ {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Interests with suggestions */}
        <TextInput
          label="💡 Her Interests"
          value={form.interests}
          onChangeText={(value) => updateField('interests', value)}
          placeholder="What does she like? Hobbies?"
          multiline
          maxLength={500}
          showCharCount
        />
        {!form.interests && (
          <View style={styles.suggestions}>
            {FIELD_SUGGESTIONS['interests']?.slice(0, 5).map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => addSuggestion('interests', s)}
              >
                <Text style={styles.suggestionText}>+ {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Green Lights with suggestions */}
        <TextInput
          label="💚 Things She Loves"
          value={form.greenLights}
          onChangeText={(value) => updateField('greenLights', value)}
          placeholder="Topics that make her happy, things she responds well to..."
          multiline
          maxLength={500}
          showCharCount
        />
        {!form.greenLights && (
          <View style={styles.suggestions}>
            {FIELD_SUGGESTIONS['greenLights']?.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => addSuggestion('greenLights', s)}
              >
                <Text style={styles.suggestionText}>+ {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Red Flags with suggestions */}
        <TextInput
          label="🚫 Things to Avoid"
          value={form.redFlags}
          onChangeText={(value) => updateField('redFlags', value)}
          placeholder="Sensitive topics, things she doesn't like..."
          multiline
          maxLength={500}
          showCharCount
        />
        {!form.redFlags && (
          <View style={styles.suggestions}>
            {FIELD_SUGGESTIONS['redFlags']?.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => addSuggestion('redFlags', s)}
              >
                <Text style={styles.suggestionText}>+ {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inside Jokes */}
        <TextInput
          label="😂 Inside Jokes"
          value={form.insideJokes}
          onChangeText={(value) => updateField('insideJokes', value)}
          placeholder="References only you two understand..."
          multiline
          maxLength={500}
          showCharCount
        />

        {/* Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Stats</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Messages</Text>
            <Text style={styles.statValue}>{selectedGirl.messageCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Last topic</Text>
            <Text style={styles.statValue}>{selectedGirl.lastTopic || 'None'}</Text>
          </View>
          {conversations.length > 0 && (
            <Button
              title={`View History (${conversations.length})`}
              onPress={() => setShowHistoryModal(true)}
              variant="ghost"
              size="sm"
              style={styles.historyButton}
            />
          )}
        </Card>

        {/* Delete Button */}
        <Button
          title={`🗑️ Delete ${selectedGirl.name}`}
          onPress={() => setShowDeleteConfirm(true)}
          variant="danger"
          fullWidth
          style={styles.deleteButton}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Delete Confirmation */}
      <DeleteDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        itemName={selectedGirl.name}
      />

      {/* Discard Changes Confirmation (4.3.11) */}
      <UnsavedChangesDialog
        visible={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onDiscard={() => {
          setShowDiscardConfirm(false);
          navigation.goBack();
        }}
        onSave={handleSave}
      />

      {/* Conversation History Modal (4.3.14) */}
      <Modal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Conversation History"
        position="bottom"
        fullHeight
      >
        <ScrollView style={styles.historyList}>
          {conversations.length === 0 ? (
            <Text style={styles.noHistory}>No conversation history yet</Text>
          ) : (
            conversations.map((conv) => (
              <View key={conv.id} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(conv.timestamp).toLocaleDateString()}
                </Text>
                <Text style={styles.historyMessage} numberOfLines={2}>
                  {conv.herMessage}
                </Text>
                {conv.selectedSuggestion && (
                  <Badge
                    text={conv.selectedSuggestion.type}
                    variant={
                      conv.selectedSuggestion.type === 'safe'
                        ? 'success'
                        : conv.selectedSuggestion.type === 'balanced'
                        ? 'warning'
                        : 'error'
                    }
                    size="sm"
                  />
                )}
              </View>
            ))
          )}
        </ScrollView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  noGirl: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a2e',
  },
  cancel: {
    color: '#888',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  save: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  saveDisabled: {
    opacity: 0.5,
  },
  form: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completenessContainer: {
    width: '100%',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  completenessLabel: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  completenessScore: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  completenessBar: {
    height: 8,
    backgroundColor: darkColors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  completenessProgress: {
    height: '100%',
    backgroundColor: darkColors.primary,
    borderRadius: 4,
  },
  completenessComplete: {
    backgroundColor: darkColors.success,
  },
  completenessHint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  suggestionChip: {
    backgroundColor: `${darkColors.primary}20`,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  suggestionText: {
    color: darkColors.primary,
    fontSize: fontSizes.xs,
  },
  statsCard: {
    marginTop: spacing.lg,
  },
  statsTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  statValue: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  historyButton: {
    marginTop: spacing.sm,
  },
  deleteButton: {
    marginTop: spacing.xl,
  },
  bottomPadding: {
    height: 50,
  },
  historyList: {
    maxHeight: 400,
  },
  noHistory: {
    color: darkColors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  historyItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  historyDate: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
  },
  historyMessage: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
});

export default GirlProfileScreen;
