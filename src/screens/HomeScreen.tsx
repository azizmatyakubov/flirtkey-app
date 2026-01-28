/**
 * HomeScreen
 * Girls list with search, sort, swipe-to-delete, and animations
 * Tasks: 4.2.5-4.2.12
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '../stores/useStore';
import { Girl } from '../types';
import { Avatar } from '../components/Avatar';
import { StageBadge } from '../components/Badge';
import { SearchBar } from '../components/SearchBar';
import { SortMenu } from '../components/SortMenu';
import { SwipeableRow } from '../components/SwipeableRow';
import { EmptyState } from '../components/EmptyState';
import { DeleteDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { darkColors, spacing } from '../constants/theme';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SORT_OPTIONS = [
  { key: 'name', label: 'Name (A-Z)', icon: '📝' },
  { key: 'name_desc', label: 'Name (Z-A)', icon: '📝' },
  { key: 'recent', label: 'Most Recent', icon: '🕐' },
  { key: 'stage', label: 'Relationship Stage', icon: '💕' },
  { key: 'messages', label: 'Message Count', icon: '💬' },
];

const STAGE_ORDER: Record<Girl['relationshipStage'], number> = {
  just_met: 1,
  talking: 2,
  flirting: 3,
  dating: 4,
  serious: 5,
};

export function HomeScreen({ navigation }: any) {
  const { girls, selectGirl, deleteGirl, apiKey } = useStore();
  const { showToast } = useToast();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Girl | null>(null);

  // Animation values for list items
  const animatedValues = useRef<Map<number, Animated.Value>>(new Map()).current;

  const getAnimatedValue = (id: number) => {
    if (!animatedValues.has(id)) {
      animatedValues.set(id, new Animated.Value(1));
    }
    return animatedValues.get(id)!;
  };

  // Filter and sort girls
  const filteredGirls = useMemo(() => {
    let result = [...girls];

    // Search filter (4.2.5)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.nickname?.toLowerCase().includes(query) ||
          g.interests?.toLowerCase().includes(query) ||
          g.personality?.toLowerCase().includes(query)
      );
    }

    // Sort (4.2.6)
    result.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'recent':
          const aTime = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : a.id;
          const bTime = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : b.id;
          return bTime - aTime;
        case 'stage':
          return STAGE_ORDER[b.relationshipStage] - STAGE_ORDER[a.relationshipStage];
        case 'messages':
          return b.messageCount - a.messageCount;
        default:
          return 0;
      }
    });

    return result;
  }, [girls, searchQuery, sortKey]);

  // Handle girl selection
  const handleSelectGirl = useCallback(
    (girl: Girl) => {
      selectGirl(girl);
      navigation.navigate('Chat');
    },
    [selectGirl, navigation]
  );

  // Handle edit (long press or swipe)
  const handleEditGirl = useCallback(
    (girl: Girl) => {
      selectGirl(girl);
      navigation.navigate('GirlProfile');
    },
    [selectGirl, navigation]
  );

  // Handle delete confirmation
  const handleDeleteGirl = useCallback((girl: Girl) => {
    setDeleteTarget(girl);
  }, []);

  // Confirm delete with animation (4.2.7)
  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    const animValue = getAnimatedValue(deleteTarget.id);

    // Animate out
    Animated.timing(animValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      deleteGirl(deleteTarget.id);
      animatedValues.delete(deleteTarget.id);
      showToast({
        message: `${deleteTarget.name} removed`,
        type: 'success',
      });
      setDeleteTarget(null);
    });
  }, [deleteTarget, deleteGirl, showToast]);

  // Pull to refresh (4.2.10)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh - in real app would sync with server
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, []);

  // Render girl card with animations (4.2.11)
  const renderGirl = useCallback(
    ({ item }: { item: Girl }) => {
      const animValue = getAnimatedValue(item.id);

      return (
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: animValue,
              transform: [
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <SwipeableRow onDelete={() => handleDeleteGirl(item)} onEdit={() => handleEditGirl(item)}>
            <TouchableOpacity
              style={styles.girlCard}
              onPress={() => handleSelectGirl(item)}
              onLongPress={() => handleEditGirl(item)}
              activeOpacity={0.7}
            >
              <Avatar name={item.name} imageUri={item.avatar} size="md" />
              <View style={styles.girlInfo}>
                <Text style={styles.girlName}>{item.name}</Text>
                <StageBadge stage={item.relationshipStage} size="sm" />
              </View>
              <View style={styles.girlMeta}>
                <Text style={styles.messageCount}>{item.messageCount} 💬</Text>
              </View>
            </TouchableOpacity>
          </SwipeableRow>
        </Animated.View>
      );
    },
    [handleSelectGirl, handleEditGirl, handleDeleteGirl]
  );

  // Empty state component (4.2.9)
  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <EmptyState
          icon="🔍"
          title="No Results"
          message={`No matches found for "${searchQuery}"`}
          action={{
            label: 'Clear Search',
            onPress: () => setSearchQuery(''),
            variant: 'outline',
          }}
        />
      );
    }

    return (
      <EmptyState
        icon="👩"
        title="No one added yet"
        message="Add someone you're texting to get started"
        action={{
          label: '+ Add Someone',
          onPress: () => navigation.navigate('AddGirl'),
        }}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
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
        <TouchableOpacity style={styles.warning} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.warningText}>⚠️ Set up your API key to start</Text>
        </TouchableOpacity>
      )}

      {/* Search and Sort Bar (4.2.5, 4.2.6) */}
      {girls.length > 0 && (
        <View style={styles.toolbar}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, interests..."
            style={styles.searchBar}
          />
          <SortMenu options={SORT_OPTIONS} selectedKey={sortKey} onSelect={setSortKey} />
        </View>
      )}

      {/* Girls List */}
      <FlatList
        data={filteredGirls}
        renderItem={renderGirl}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, filteredGirls.length === 0 && styles.listEmpty]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={darkColors.primary}
            colors={[darkColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        // Performance optimizations (4.2.12)
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        getItemLayout={(_data, index) => ({
          length: 82, // Height of each card + margin
          offset: 82 * index,
          index,
        })}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddGirl')}>
        <Text style={styles.addButtonText}>+ Add Someone</Text>
      </TouchableOpacity>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || ''}
      />
    </GestureHandlerRootView>
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  list: {
    padding: 15,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  girlCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  girlInfo: {
    flex: 1,
    marginLeft: 15,
    gap: spacing.xs,
  },
  girlName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  girlMeta: {
    alignItems: 'flex-end',
  },
  messageCount: {
    color: '#666',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#6366f1',
    margin: 15,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
