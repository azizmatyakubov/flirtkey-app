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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import { darkColors, spacing, accentColors, shadows, borderRadius } from '../constants/theme';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SORT_OPTIONS = [
  { key: 'name', label: 'Name (A-Z)', icon: 'text-outline' },
  { key: 'name_desc', label: 'Name (Z-A)', icon: 'text-outline' },
  { key: 'recent', label: 'Most Recent', icon: 'time-outline' },
  { key: 'stage', label: 'Relationship Stage', icon: 'heart-outline' },
  { key: 'messages', label: 'Message Count', icon: 'chatbubble-outline' },
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.messageCount}>{item.messageCount}</Text>
                  <Ionicons name="chatbubble-outline" size={14} color={darkColors.textSecondary} />
                </View>
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
        icon="💌"
        title="Your love life starts here"
        message="Add someone you're texting to unlock AI-powered replies"
        action={{
          label: '+ Add Someone',
          onPress: () => navigation.navigate('AddGirl'),
        }}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>FlirtKey</Text>
            <Text style={styles.subtitle}>Your secret texting weapon</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* API Key Warning */}
      {!apiKey && (
        <TouchableOpacity style={styles.warning} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="warning-outline" size={18} color={accentColors.gold} />
          <Text style={styles.warningText}>Set up your API key to start</Text>
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
          length: 88,
          offset: 88 * index,
          index,
        })}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddGirl')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[accentColors.gradientStart, accentColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
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
    backgroundColor: darkColors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warning: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 14,
    margin: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    color: accentColors.gold,
    fontWeight: '600',
    fontSize: 14,
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
    padding: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  girlCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.md,
  },
  girlInfo: {
    flex: 1,
    marginLeft: 16,
    gap: spacing.xs,
  },
  girlName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  girlMeta: {
    alignItems: 'flex-end',
  },
  messageCount: {
    color: darkColors.textSecondary,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    ...shadows.glow,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
