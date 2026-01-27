import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useStore } from '../stores/useStore';
import { Culture, RelationshipStage } from '../types';

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

export function AddGirlScreen({ navigation }: any) {
  const { addGirl } = useStore();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [culture, setCulture] = useState<Culture>('universal');
  const [personality, setPersonality] = useState('');
  const [interests, setInterests] = useState('');
  const [howMet, setHowMet] = useState('');
  const [stage, setStage] = useState<RelationshipStage>('just_met');

  const handleSave = () => {
    if (!name.trim()) return;
    
    addGirl({
      name: name.trim(),
      age: age ? parseInt(age) : undefined,
      culture,
      personality: personality || undefined,
      interests: interests || undefined,
      howMet: howMet || undefined,
      relationshipStage: stage,
    });
    
    navigation.navigate('Chat');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Someone</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.save, !name.trim() && styles.saveDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        {/* Name */}
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Her name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        {/* Age */}
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor="#666"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />

        {/* Culture */}
        <Text style={styles.label}>Her Culture</Text>
        <View style={styles.options}>
          {CULTURES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.option, culture === c.key && styles.optionSelected]}
              onPress={() => setCulture(c.key)}
            >
              <Text style={styles.optionEmoji}>{c.emoji}</Text>
              <Text style={[styles.optionText, culture === c.key && styles.optionTextSelected]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stage */}
        <Text style={styles.label}>Relationship Stage</Text>
        <View style={styles.options}>
          {STAGES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.option, stage === s.key && styles.optionSelected]}
              onPress={() => setStage(s.key)}
            >
              <Text style={styles.optionEmoji}>{s.emoji}</Text>
              <Text style={[styles.optionText, stage === s.key && styles.optionTextSelected]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Personality */}
        <Text style={styles.label}>Her Personality</Text>
        <TextInput
          style={styles.input}
          placeholder="shy, outgoing, funny, intellectual..."
          placeholderTextColor="#666"
          value={personality}
          onChangeText={setPersonality}
        />

        {/* Interests */}
        <Text style={styles.label}>Her Interests</Text>
        <TextInput
          style={styles.input}
          placeholder="What does she like?"
          placeholderTextColor="#666"
          value={interests}
          onChangeText={setInterests}
        />

        {/* How Met */}
        <Text style={styles.label}>How You Met</Text>
        <TextInput
          style={styles.input}
          placeholder="Tinder, Instagram, university..."
          placeholderTextColor="#666"
          value={howMet}
          onChangeText={setHowMet}
        />

        <Text style={styles.hint}>
          💡 You can add more details later (inside jokes, things to avoid, etc.)
        </Text>
      </ScrollView>
    </View>
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
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionSelected: {
    backgroundColor: '#6366f120',
    borderColor: '#6366f1',
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    color: '#888',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fff',
  },
  hint: {
    color: '#666',
    fontSize: 13,
    marginTop: 30,
    textAlign: 'center',
  },
});
