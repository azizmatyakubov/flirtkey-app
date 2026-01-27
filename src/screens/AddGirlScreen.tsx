/**
 * AddGirlScreen
 * Form to add a new girl profile with photo, validation, and confirmations
 * Tasks: 4.1.9-4.1.15
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useStore } from '../stores/useStore';
import { Culture, RelationshipStage } from '../types';
import {
  TextInput,
  Select,
  Avatar,
  Button,
  ConfirmDialog,
  UnsavedChangesDialog,
  useToast,
} from '../components';
import { useImagePicker } from '../hooks/useImagePicker';
import { validateName, validateAge } from '../utils/validation';
import { spacing } from '../constants/theme';

const CULTURES: { key: Culture; label: string; emoji: string }[] = [
  { key: 'uzbek', label: 'Uzbek', emoji: '🇺🇿' },
  { key: 'russian', label: 'Russian/CIS', emoji: '🇷🇺' },
  { key: 'western', label: 'Western', emoji: '🇺🇸' },
  { key: 'asian', label: 'Asian', emoji: '🇯🇵' },
  { key: 'universal', label: 'Universal', emoji: '🌐' },
];

const STAGES: { key: RelationshipStage; label: string; emoji: string }[] = [
  { key: 'just_met', label: 'Just Met', emoji: '🆕' },
  { key: 'talking', label: 'Talking', emoji: '💬' },
  { key: 'flirting', label: 'Flirting', emoji: '😏' },
  { key: 'dating', label: 'Dating', emoji: '❤️' },
  { key: 'serious', label: 'Serious', emoji: '💑' },
];

interface FormErrors {
  name?: string;
  age?: string;
}

export function AddGirlScreen({ navigation }: any) {
  const { addGirl } = useStore();
  const { showToast } = useToast();
  const { pickFromLibrary, image: selectedImage, clear: clearImage } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [culture, setCulture] = useState<Culture>('universal');
  const [personality, setPersonality] = useState('');
  const [interests, setInterests] = useState('');
  const [howMet, setHowMet] = useState('');
  const [stage, setStage] = useState<RelationshipStage>('just_met');
  const [avatar, setAvatar] = useState<string | undefined>();

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<any>(null);

  // Check if form is dirty
  const isDirty = name || age || personality || interests || howMet || avatar;

  // Update avatar when image is selected
  useEffect(() => {
    if (selectedImage?.uri) {
      setAvatar(selectedImage.uri);
    }
  }, [selectedImage]);

  // Dismiss keyboard on tap outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate name
    const nameResult = validateName(name);
    if (!nameResult.valid) {
      newErrors.name = nameResult.error;
      isValid = false;
    }

    // Validate age (optional but must be valid if provided)
    if (age) {
      const ageResult = validateAge(parseInt(age, 10));
      if (!ageResult.valid) {
        newErrors.age = ageResult.error;
        isValid = false;
      }
    }

    setErrors(newErrors);

    // Scroll to first error
    if (!isValid) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }

    return isValid;
  }, [name, age]);

  // Handle photo selection
  const handleSelectPhoto = async () => {
    const result = await pickFromLibrary();
    if (result?.uri) {
      setAvatar(result.uri);
    }
  };

  // Handle remove photo
  const handleRemovePhoto = () => {
    setAvatar(undefined);
    clearImage();
  };

  // Handle save with confirmation
  const handleSavePress = () => {
    dismissKeyboard();
    if (!validateForm()) {
      showToast({
        message: 'Please fix the errors above',
        type: 'error',
      });
      return;
    }
    setShowSaveConfirm(true);
  };

  // Perform save
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      addGirl({
        name: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        culture,
        personality: personality || undefined,
        interests: interests || undefined,
        howMet: howMet || undefined,
        relationshipStage: stage,
        avatar,
      });

      showToast({
        message: `${name.trim()} added successfully! 🎉`,
        type: 'success',
      });

      navigation.navigate('Chat');
    } catch (error) {
      showToast({
        message: 'Failed to save. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  };

  // Handle cancel with confirmation if dirty
  const handleCancel = () => {
    dismissKeyboard();
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigation.goBack();
    }
  };

  // Handle discard
  const handleDiscard = () => {
    setShowDiscardConfirm(false);
    navigation.goBack();
  };

  // Clear field error on change
  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleAgeChange = (value: string) => {
    // Only allow digits
    const numericValue = value.replace(/[^0-9]/g, '');
    setAge(numericValue);
    if (errors.age) {
      setErrors((prev) => ({ ...prev, age: undefined }));
    }
  };

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
        <Text style={styles.title}>Add Someone</Text>
        <TouchableOpacity onPress={handleSavePress} disabled={!name.trim() || isSaving}>
          <Text style={[styles.save, (!name.trim() || isSaving) && styles.saveDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo (4.1.9) */}
        <View style={styles.photoSection}>
          <Avatar
            name={name || 'New'}
            imageUri={avatar}
            size="xl"
            onPress={handleSelectPhoto}
            showEditBadge
          />
          <View style={styles.photoButtons}>
            <Button
              title="Choose Photo"
              onPress={handleSelectPhoto}
              variant="outline"
              size="sm"
            />
            {avatar && (
              <Button
                title="Remove"
                onPress={handleRemovePhoto}
                variant="ghost"
                size="sm"
              />
            )}
          </View>
        </View>

        {/* Name (4.1.10) */}
        <TextInput
          ref={nameInputRef}
          label="Name"
          value={name}
          onChangeText={handleNameChange}
          placeholder="Her name"
          error={errors.name}
          required
          autoFocus
          returnKeyType="next"
        />

        {/* Age (4.1.10) */}
        <TextInput
          label="Age"
          value={age}
          onChangeText={handleAgeChange}
          placeholder="Age"
          error={errors.age}
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType="next"
        />

        {/* Culture */}
        <Select
          label="Her Culture"
          value={culture}
          options={CULTURES}
          onChange={setCulture}
        />

        {/* Stage */}
        <Select
          label="Relationship Stage"
          value={stage}
          options={STAGES}
          onChange={setStage}
        />

        {/* Personality */}
        <TextInput
          label="Her Personality"
          value={personality}
          onChangeText={setPersonality}
          placeholder="shy, outgoing, funny, intellectual..."
          multiline
          maxLength={500}
          showCharCount
        />

        {/* Interests */}
        <TextInput
          label="Her Interests"
          value={interests}
          onChangeText={setInterests}
          placeholder="What does she like?"
          multiline
          maxLength={500}
          showCharCount
        />

        {/* How Met */}
        <TextInput
          label="How You Met"
          value={howMet}
          onChangeText={setHowMet}
          placeholder="Tinder, Instagram, university..."
          multiline
          maxLength={200}
        />

        <Text style={styles.hint}>
          💡 You can add more details later (inside jokes, things to avoid, etc.)
        </Text>

        {/* Extra padding for keyboard */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Save Confirmation Dialog (4.1.11) */}
      <ConfirmDialog
        visible={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        title={`Add ${name.trim()}?`}
        message="You can always edit their profile later to add more details."
        confirmText="Add"
        cancelText="Keep Editing"
        confirmVariant="primary"
        isLoading={isSaving}
        icon="👩"
      />

      {/* Discard Confirmation Dialog (4.1.12) */}
      <UnsavedChangesDialog
        visible={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onDiscard={handleDiscard}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  hint: {
    color: '#666',
    fontSize: 13,
    marginTop: 20,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default AddGirlScreen;
