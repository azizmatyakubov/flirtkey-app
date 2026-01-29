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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../stores/useStore';
import { Culture, RelationshipStage } from '../types';
import { TextInput } from '../components/TextInput';
import { Select } from '../components/Select';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { ConfirmDialog, UnsavedChangesDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useImagePicker } from '../hooks/useImagePicker';
import { validateName, validateAge } from '../utils/validation';
import { darkColors, accentColors, spacing, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';

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

  // Dismiss keyboard on tap
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    const nameResult = validateName(name);
    if (!nameResult.valid) {
      newErrors.name = nameResult.error;
      isValid = false;
    }

    if (age) {
      const ageResult = validateAge(parseInt(age, 10));
      if (!ageResult.valid) {
        newErrors.age = ageResult.error;
        isValid = false;
      }
    }

    setErrors(newErrors);

    if (!isValid) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }

    return isValid;
  }, [name, age]);

  const handleSelectPhoto = async () => {
    const result = await pickFromLibrary();
    if (result?.uri) {
      setAvatar(result.uri);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar(undefined);
    clearImage();
  };

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
        message: `${name.trim()} added successfully!`,
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

  const handleCancel = () => {
    dismissKeyboard();
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(false);
    navigation.goBack();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleAgeChange = (value: string) => {
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
      {/* Gradient Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Someone</Text>
        <TouchableOpacity
          onPress={handleSavePress}
          disabled={!name.trim() || isSaving}
          style={styles.headerButton}
        >
          <Text style={[styles.save, (!name.trim() || isSaving) && styles.saveDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo */}
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

        {/* Name */}
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

        {/* Age */}
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

        <View style={styles.hintContainer}>
          <Ionicons name="bulb" size={16} color={accentColors.gold} />
          <Text style={styles.hint}>
            Add more details about this connection later (inside jokes, things to avoid, etc.)
          </Text>
        </View>

        {/* Extra padding for keyboard */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Save Confirmation Dialog */}
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

      {/* Discard Confirmation Dialog */}
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
    backgroundColor: darkColors.background,
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
    fontFamily: fonts.bold,
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  hint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default AddGirlScreen;
