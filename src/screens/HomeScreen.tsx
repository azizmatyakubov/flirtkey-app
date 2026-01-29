/**
 * HomeScreen
 * Contacts list with search, sort, swipe-to-delete, and animations
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
import { useStore } from '../stores/useStore';
import { useHistory } from '../hooks/useHistory';
import { Contact } from '../types';
import { Avatar } from '../components/Avatar';
import { StageBadge } from '../components/Badge';
import { SearchBar } from '../components/SearchBar';
import { SortMenu } from '../components/SortMenu';
import { SwipeableRow } from '../components/SwipeableRow';
import { EmptyState } from '../components/EmptyState';
import { DeleteDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { darkColors, spacing, accentColors, shadows, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';
import type { RootNavigationProp } from '../types/navigation';

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

const STAGE_ORDER: Record<Contact['relationshipStage'], number> = {
  just_met: 1,
  talking: 2,
  flirting: 3,
  dating: 4,
  serious: 5,
};

export function HomeScreen({ navigation }: { navigation: RootNavigationProp }) {
  const contacts = useStore((s) => s.contacts);
  const selectContact = useStore((s) => s.selectContact);
  const deleteContact = useStore((s) => s.deleteContact);
  const apiKey = useStore((s) => s.apiKey);
  const apiMode = useStore((s) => s.apiMode);
  const { showToast } = useToast();
  const { usageCounts, totalCount } = useHistory();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  // Animation values for list items
  const animatedValues = useRef<Map<number, Animated.Value>>(new Map()).current;

  const getAnimatedValue = (id: number) => {
    if (!animatedValues.has(id)) {
      animatedValues.set(id, new Animated.Value(1));
    }
    return animatedValues.get(id)!;
  };

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

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
  }, [contacts, searchQuery, sortKey]);

  // Handle contact selection
  const handleSelectContact = useCallback(
    (contact: Contact) => {
      selectContact(contact);
      navigation.navigate('Chat');
    },
    [selectContact, navigation]
  );

  // Handle edit (long press or swipe)
  const handleEditContact = useCallback(
    (contact: Contact) => {
      selectContact(contact);
      navigation.navigate({ name: 'ContactProfile', params: {} });
    },
    [selectContact, navigation]
  );

  // Handle delete confirmation
  const handleDeleteContact = useCallback((contact: Contact) => {
    setDeleteTarget(contact);
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
      deleteContact(deleteTarget.id);
      animatedValues.delete(deleteTarget.id);
      showToast({
        message: `${deleteTarget.name} removed`,
        type: 'success',
      });
      setDeleteTarget(null);
    });
  }, [deleteTarget, deleteContact, showToast]);

  // Pull to refresh (4.2.10)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh - in real app would sync with server
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, []);

  // Render contact card with animations (4.2.11)
  const renderContact = useCallback(
    ({ item }: { item: Contact }) => {
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
          <SwipeableRow onDelete={() => handleDeleteContact(item)} onEdit={() => handleEditContact(item)}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleSelectContact(item)}
              onLongPress={() => handleEditContact(item)}
              activeOpacity={0.7}
              accessibilityLabel={`${item.name}, ${item.relationshipStage.replace('_', ' ')}, ${item.messageCount} messages`}
              accessibilityRole="button"
              accessibilityHint="Tap to open chat, long press to edit"
            >
              <Avatar name={item.name} imageUri={item.avatar} size="md" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <StageBadge stage={item.relationshipStage} size="sm" />
              </View>
              <View style={styles.contactMeta}>
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
    [handleSelectContact, handleEditContact, handleDeleteContact]
  );

  // Empty state component (4.2.9)
  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <EmptyState
          icon="🔍"
          title="No Results"
          message={`No connections found for "${searchQuery}"`}
          action={{
            label: 'Clear Search',
            onPress: () => setSearchQuery(''),
            variant: 'outline',
          }}
        />
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={[accentColors.gradientStart + '30', accentColors.gradientEnd + '30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyCircle}
        >
          <Ionicons name="heart-half" size={52} color={accentColors.rose} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Add your first connection</Text>
        <Text style={styles.emptySubtext}>Get AI-powered replies tailored just for them</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddContact')}
          activeOpacity={0.85}
          style={styles.emptyCTAWrapper}
        >
          <LinearGradient
            colors={[accentColors.gradientStart, accentColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyCTA}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.emptyCTAText}>New Connection</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* API Key Warning — only shown in BYOK mode when no key is set */}
      {apiMode === 'byok' && !apiKey && (
        <TouchableOpacity style={styles.warning} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="warning-outline" size={18} color={accentColors.gold} />
          <Text style={styles.warningText}>Set up your API key to start</Text>
        </TouchableOpacity>
      )}

      {/* Search and Sort Bar (4.2.5, 4.2.6) */}
      {contacts.length > 0 && (
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

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, filteredContacts.length === 0 && styles.listEmpty]}
        ListHeaderComponent={
          contacts.length > 0 ? (
            <View style={styles.quickActions}>
              {/* Stats row */}
              {totalCount > 0 && (
                <TouchableOpacity
                  style={styles.statsRow}
                  onPress={() => navigation.navigate('History' as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sparkles" size={16} color={accentColors.gold} />
                  <Text style={styles.statsText}>
                    {totalCount} AI {totalCount === 1 ? 'reply' : 'replies'} generated
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={darkColors.textTertiary} />
                </TouchableOpacity>
              )}

              {/* Quick action cards */}
              <View style={styles.quickActionCards}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('QuickReply')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#FF6B6B20', '#FF6B6B08']}
                    style={styles.quickActionGradient}
                  >
                    <Text style={styles.quickActionEmoji}>💬</Text>
                    <Text style={styles.quickActionLabel}>Reply</Text>
                    {usageCounts.chat_reply + usageCounts.quick_reply > 0 && (
                      <View style={styles.usageBadge}>
                        <Text style={styles.usageBadgeText}>
                          {usageCounts.chat_reply + usageCounts.quick_reply}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('BioGenerator')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#A78BFA20', '#A78BFA08']}
                    style={styles.quickActionGradient}
                  >
                    <Text style={styles.quickActionEmoji}>📝</Text>
                    <Text style={styles.quickActionLabel}>Bio</Text>
                    {usageCounts.bio > 0 && (
                      <View style={[styles.usageBadge, { backgroundColor: '#A78BFA' }]}>
                        <Text style={styles.usageBadgeText}>{usageCounts.bio}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('OpenerGenerator')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#34D39920', '#34D39908']}
                    style={styles.quickActionGradient}
                  >
                    <Text style={styles.quickActionEmoji}>👋</Text>
                    <Text style={styles.quickActionLabel}>Opener</Text>
                    {usageCounts.opener > 0 && (
                      <View style={[styles.usageBadge, { backgroundColor: '#34D399' }]}>
                        <Text style={styles.usageBadgeText}>{usageCounts.opener}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
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
        onPress={() => navigation.navigate('AddContact')}
        activeOpacity={0.85}
        accessibilityLabel="Add new connection"
        accessibilityRole="button"
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
    </View>
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
    fontFamily: fonts.extraBold,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    letterSpacing: 0.3,
    fontFamily: fonts.regular,
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
  quickActions: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: darkColors.surface,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  statsText: {
    flex: 1,
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  quickActionCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  quickActionGradient: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionLabel: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  usageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: accentColors.coral,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  usageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.bold,
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
  contactCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.md,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
    gap: spacing.xs,
  },
  contactName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
  contactMeta: {
    alignItems: 'flex-end',
  },
  messageCount: {
    color: darkColors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyCTAWrapper: {
    ...shadows.glow,
    borderRadius: borderRadius.lg,
  },
  emptyCTA: {
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCTAText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
    fontFamily: fonts.bold,
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
