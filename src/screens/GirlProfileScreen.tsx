import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useStore } from '../stores/useStore';
import { Culture, RelationshipStage } from '../types';

const STAGES: { key: RelationshipStage; label: string; emoji: string }[] = [
  { key: 'just_met', label: 'Just Met', emoji: '🆕' },
  { key: 'talking', label: 'Talking', emoji: '💬' },
  { key: 'flirting', label: 'Flirting', emoji: '😏' },
  { key: 'dating', label: 'Dating', emoji: '❤️' },
  { key: 'serious', label: 'Serious', emoji: '💑' },
];

export function GirlProfileScreen({ navigation }: any) {
  const { selectedGirl, updateGirl, deleteGirl } = useStore();
  
  const [personality, setPersonality] = useState(selectedGirl?.personality || '');
  const [interests, setInterests] = useState(selectedGirl?.interests || '');
  const [greenLights, setGreenLights] = useState(selectedGirl?.greenLights || '');
  const [redFlags, setRedFlags] = useState(selectedGirl?.redFlags || '');
  const [insideJokes, setInsideJokes] = useState(selectedGirl?.insideJokes || '');
  const [stage, setStage] = useState<RelationshipStage>(
    selectedGirl?.relationshipStage || 'just_met'
  );

  if (!selectedGirl) {
    return (
      <View style={styles.container}>
        <Text style={styles.noGirl}>No girl selected</Text>
      </View>
    );
  }

  const handleSave = () => {
    updateGirl(selectedGirl.id, {
      personality,
      interests,
      greenLights,
      redFlags,
      insideJokes,
      relationshipStage: stage,
    });
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete ' + selectedGirl.name + '?',
      'This cannot be undone',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGirl(selectedGirl.id);
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedGirl.name}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.save}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        {/* Stage */}
        <Text style={styles.label}>📈 Relationship Stage</Text>
        <View style={styles.stages}>
          {STAGES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.stage, stage === s.key && styles.stageSelected]}
              onPress={() => setStage(s.key)}
            >
              <Text style={styles.stageEmoji}>{s.emoji}</Text>
              <Text style={[styles.stageText, stage === s.key && styles.stageTextSelected]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Personality */}
        <Text style={styles.label}>🎭 Her Personality</Text>
        <TextInput
          style={styles.input}
          placeholder="shy, outgoing, funny, sarcastic..."
          placeholderTextColor="#666"
          value={personality}
          onChangeText={setPersonality}
          multiline
        />

        {/* Interests */}
        <Text style={styles.label}>💡 Her Interests</Text>
        <TextInput
          style={styles.input}
          placeholder="What does she like? Hobbies?"
          placeholderTextColor="#666"
          value={interests}
          onChangeText={setInterests}
          multiline
        />

        {/* Green Lights */}
        <Text style={styles.label}>💚 Things She Loves</Text>
        <TextInput
          style={styles.input}
          placeholder="Topics that make her happy, things she responds well to..."
          placeholderTextColor="#666"
          value={greenLights}
          onChangeText={setGreenLights}
          multiline
        />

        {/* Red Flags */}
        <Text style={styles.label}>🚫 Things to Avoid</Text>
        <TextInput
          style={styles.input}
          placeholder="Sensitive topics, things she doesn't like..."
          placeholderTextColor="#666"
          value={redFlags}
          onChangeText={setRedFlags}
          multiline
        />

        {/* Inside Jokes */}
        <Text style={styles.label}>😂 Inside Jokes</Text>
        <TextInput
          style={styles.input}
          placeholder="References only you two understand..."
          placeholderTextColor="#666"
          value={insideJokes}
          onChangeText={setInsideJokes}
          multiline
        />

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.statsTitle}>📊 Stats</Text>
          <Text style={styles.stat}>Messages: {selectedGirl.messageCount}</Text>
          <Text style={styles.stat}>
            Last topic: {selectedGirl.lastTopic || 'None'}
          </Text>
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑️ Delete {selectedGirl.name}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  form: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  stages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stage: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageSelected: {
    backgroundColor: '#6366f120',
    borderColor: '#6366f1',
  },
  stageEmoji: {
    fontSize: 14,
  },
  stageText: {
    color: '#888',
    fontSize: 13,
  },
  stageTextSelected: {
    color: '#fff',
  },
  stats: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  stat: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#ef444420',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
  },
});
