import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useStore } from '../stores/useStore';
import { Girl } from '../types';

const STAGE_EMOJI = {
  just_met: '🆕',
  talking: '💬',
  flirting: '😏',
  dating: '❤️',
  serious: '💑',
};

const STAGE_NAMES = {
  just_met: 'Just Met',
  talking: 'Talking',
  flirting: 'Flirting',
  dating: 'Dating',
  serious: 'Serious',
};

export function HomeScreen({ navigation }: any) {
  const { girls, selectGirl, apiKey } = useStore();

  const handleSelectGirl = (girl: Girl) => {
    selectGirl(girl);
    navigation.navigate('Chat');
  };

  const renderGirl = ({ item }: { item: Girl }) => (
    <TouchableOpacity
      style={styles.girlCard}
      onPress={() => handleSelectGirl(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.girlInfo}>
        <Text style={styles.girlName}>{item.name}</Text>
        <Text style={styles.girlStage}>
          {STAGE_EMOJI[item.relationshipStage]} {STAGE_NAMES[item.relationshipStage]}
        </Text>
      </View>
      <Text style={styles.messageCount}>{item.messageCount} 💬</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💘 FlirtKey</Text>
          <Text style={styles.subtitle}>Your secret texting weapon</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* API Key Warning */}
      {!apiKey && (
        <TouchableOpacity
          style={styles.warning}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.warningText}>
            ⚠️ Set up your API key to start
          </Text>
        </TouchableOpacity>
      )}

      {/* Girls List */}
      {girls.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👩</Text>
          <Text style={styles.emptyText}>No one added yet</Text>
          <Text style={styles.emptySubtext}>
            Add someone you're texting to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={girls}
          renderItem={renderGirl}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddGirl')}
      >
        <Text style={styles.addButtonText}>+ Add Someone</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  settingsButton: {
    padding: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  warning: {
    backgroundColor: '#f59e0b20',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  girlCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  girlInfo: {
    flex: 1,
    marginLeft: 15,
  },
  girlName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  girlStage: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  messageCount: {
    color: '#666',
    fontSize: 14,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#6366f1',
    margin: 15,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
