/**
 * ContactProfileScreen
 * Edit contact profile with change detection, completeness indicator, and conversation history
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { darkColors, accentColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import type { RootNavigationProp } from '../types/navigation';

const STAGES: { key: RelationshipStage; label: string; emoji: string }[] = [
  { key: 'just_met', label: 'Just Met', emoji: '🆕' },
  { key: 'talking', label: 'Talking', emoji: '💬' },
  { key: 'flirting', label: 'Flirting', emoji: '😏' },
  { key: 'dating', label: 'Dating', emoji: '❤️' },
  { key: 'serious', label: 'Serious', emoji: '💑' },
];

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

export function ContactProfileScreen({ navigation }: { navigation: RootNavigationProp }) {
  const selectedContact = useStore((s) => s.selectedContact);
  const updateContact = useStore((s) => s.updateContact);
  const deleteContact = useStore((s) => s.deleteContact);
  const getConversationsForContact = useStore((s) => s.getConversationsForContact);
  const { showToast } = useToast();
  const { pickFromLibrary } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
  });

  const originalValues = useMemo(
    () => ({
      personality: selectedContact?.personality || '',
      interests: selectedContact?.interests || '',
      greenLights: selectedContact?.greenLights || '',
      redFlags: selectedContact?.redFlags || '',
      insideJokes: selectedContact?.insideJokes || '',
      stage: selectedContact?.relationshipStage || 'just_met',
      avatar: selectedContact?.avatar,
    }),
    [selectedContact]
  );

  const [form, setForm] = useState<FormState>(originalValues);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const conversations = useMemo(() => {
    if (!selectedContact) return [];
    return getConversationsForContact(selectedContact.id);
  }, [selectedContact, getConversationsForContact]);

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

  const completeness = useMemo(() => {
    if (!selectedContact) return { score: 0, fields: [] };

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
  }, [form, selectedContact]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectPhoto = async () => {
    try {
      const result = await pickFromLibrary();
      if (result?.uri) {
        updateField('avatar', result.uri);
      }
    } catch {
      showToast({
        message: 'Failed to select photo. Please try again.',
        type: 'error',
      });
    }
  };

  const handleSave = async () => {
    if (!selectedContact) return;

    setIsSaving(true);
    try {
      updateContact(selectedContact.id, {
        personality: form.personality || undefined,
        interests: form.interests || undefined,
        greenLights: form.greenLights || undefined,
        redFlags: form.redFlags || undefined,
        insideJokes: form.insideJokes || undefined,
        relationshipStage: form.stage,
        avatar: form.avatar,
      });

      showToast({
        message: 'Profile updated!',
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

  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    if (!selectedContact) return;
    deleteContact(selectedContact.id);
    showToast({
      message: `${selectedContact.name} removed`,
      type: 'success',
    });
    navigation.navigate('Home');
  };

  const addSuggestion = (field: keyof typeof FIELD_SUGGESTIONS, suggestion: string) => {
    const currentValue = form[field as keyof FormState] as string;
    const newValue = currentValue ? `${currentValue}, ${suggestion}` : suggestion;
    updateField(field as keyof FormState, newValue);
  };

  if (!selectedContact) {
    return (
      <View style={styles.container}>
        <Text style={styles.noContact}>No profile selected</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton} accessibilityLabel="Cancel" accessibilityRole="button">
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">{selectedContact.name}</Text>
        <TouchableOpacity onPress={handleSave} disabled={!hasChanges || isSaving} style={styles.headerButton} accessibilityLabel={isSaving ? 'Saving...' : 'Save changes'} accessibilityRole="button" accessibilityState={{ disabled: !hasChanges || isSaving }}>
          <Text style={[styles.save, (!hasChanges || isSaving) && styles.saveDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo & Completeness */}
        <View style={styles.profileSection}>
          <Avatar
            name={selectedContact.name}
            imageUri={form.avatar}
            size="xl"
            onPress={handleSelectPhoto}
            showEditBadge
          />

          {/* Completeness Indicator */}
          <View style={styles.completenessContainer}>
            <View style={styles.completenessHeader}>
              <View style={styles.completenessLabelRow}>
                <Ionicons name="analytics" size={16} color={accentColors.coral} />
                <Text style={styles.completenessLabel}>Profile Completeness</Text>
              </View>
              <Text style={styles.completenessScore}>{completeness.score}%</Text>
            </View>
            <View style={styles.completenessBar}>
              <LinearGradient
                colors={[accentColors.gradientStart, accentColors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.completenessProgress,
                  { width: `${completeness.score}%` as unknown as number },
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
          label="Relationship Stage"
          value={form.stage}
          options={STAGES}
          onChange={(value) => updateField('stage', value)}
        />

        {/* Personality with suggestions */}
        <TextInput
          label="Her Personality"
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
                <Ionicons name="add" size={12} color={accentColors.coral} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Interests with suggestions */}
        <TextInput
          label="Her Interests"
          value={form.interests}
          onChangeText={(value) => updateField('interests', value)}
          placeholder="What do they like? Hobbies?"
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
                <Ionicons name="add" size={12} color={accentColors.coral} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Green Lights with suggestions */}
        <TextInput
          label="Things She Loves"
          value={form.greenLights}
          onChangeText={(value) => updateField('greenLights', value)}
          placeholder="Topics that make them happy, things they respond well to..."
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
                <Ionicons name="add" size={12} color={accentColors.coral} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Red Flags with suggestions */}
        <TextInput
          label="Things to Avoid"
          value={form.redFlags}
          onChangeText={(value) => updateField('redFlags', value)}
          placeholder="Sensitive topics, things they don't like..."
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
                <Ionicons name="add" size={12} color={accentColors.coral} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inside Jokes */}
        <TextInput
          label="Inside Jokes"
          value={form.insideJokes}
          onChangeText={(value) => updateField('insideJokes', value)}
          placeholder="References only you two understand..."
          multiline
          maxLength={500}
          showCharCount
        />

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsTitleRow}>
            <Ionicons name="bar-chart" size={18} color={accentColors.coral} />
            <Text style={styles.statsTitle}>Stats</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Messages</Text>
            <Text style={styles.statValue}>{selectedContact.messageCount}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Last topic</Text>
            <Text style={styles.statValue}>{selectedContact.lastTopic || 'None'}</Text>
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
          title={`Delete ${selectedContact.name}`}
          onPress={() => setShowDeleteConfirm(true)}
          variant="danger"
          fullWidth
          style={styles.deleteButton}
          leftIcon={<Ionicons name="trash" size={18} color={darkColors.error} />}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Delete Confirmation */}
      <DeleteDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        itemName={selectedContact.name}
      />

      {/* Discard Changes Confirmation */}
      <UnsavedChangesDialog
        visible={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onDiscard={() => {
          setShowDiscardConfirm(false);
          navigation.goBack();
        }}
        onSave={handleSave}
      />

      {/* Conversation History Modal */}
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
                  {conv.theirMessage}
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
    backgroundColor: darkColors.background,
  },
  noContact: {
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
    fontSize: fontSizes.md,
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
  title: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  save: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  saveDisabled: {
    opacity: 0.5,
  },
  form: {
    padding: spacing.lg,
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
  completenessLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completenessLabel: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  completenessScore: {
    color: accentColors.coral,
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
    borderRadius: 4,
  },
  completenessComplete: {
    // Override gradient to success green when complete
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${accentColors.coral}15`,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: `${accentColors.coral}40`,
  },
  suggestionText: {
    color: accentColors.coral,
    fontSize: fontSizes.xs,
  },
  statsCard: {
    marginTop: spacing.lg,
  },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statsTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
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

export default ContactProfileScreen;
