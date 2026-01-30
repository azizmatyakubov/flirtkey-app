/**
 * CoachScreen - Interactive Conversation Practice
 * Hour 1: Conversation Coach Feature
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  COACH_SCENARIOS,
  CoachScenario,
  CoachSession,
  CoachMessage,
  CoachDifficulty,
  createSession,
  addUserMessage,
  getDifficultyInfo,
  saveSessions,
  loadSessions,
} from '../services/coachService';
import { darkColors, accentColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { fonts } from '../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// Sub-components
// ==========================================

function ScenarioCard({
  scenario,
  onSelect,
}: {
  scenario: CoachScenario;
  onSelect: (s: CoachScenario) => void;
}) {
  const info = getDifficultyInfo(scenario.difficulty);

  return (
    <Animated.View entering={FadeInDown.delay(100)}>
      <TouchableOpacity
        style={styles.scenarioCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(scenario);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.scenarioHeader}>
          <Text style={styles.scenarioEmoji}>{info.emoji}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: info.color + '22' }]}>
            <Text style={[styles.difficultyText, { color: info.color }]}>{info.label}</Text>
          </View>
        </View>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.scenarioDesc}>{scenario.description}</Text>
        <View style={styles.scenarioMeta}>
          <Text style={styles.scenarioMatchName}>Match: {scenario.matchName}</Text>
          <Ionicons name="chevron-forward" size={16} color={darkColors.textTertiary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StarRating({ score }: { score: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(score);
    const half = !filled && i <= score + 0.5;
    stars.push(
      <Ionicons
        key={i}
        name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
        size={14}
        color={filled || half ? accentColors.gold : darkColors.textTertiary}
      />
    );
  }
  return <View style={styles.starContainer}>{stars}</View>;
}

function ChatMessageBubble({ message }: { message: CoachMessage }) {
  if (message.role === 'coach') {
    return (
      <Animated.View entering={FadeIn.delay(200)} style={styles.coachCard}>
        <View style={styles.coachHeader}>
          <Ionicons name="school" size={16} color={accentColors.coral} />
          <Text style={styles.coachLabel}>Coach Feedback</Text>
          {message.score && <StarRating score={message.score} />}
        </View>
        <Text style={styles.coachText}>{message.text}</Text>
      </Animated.View>
    );
  }

  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={isUser ? SlideInRight.delay(50) : FadeIn.delay(100)}
      style={[styles.messageBubble, isUser ? styles.userBubble : styles.matchBubble]}
    >
      {!isUser && <Text style={styles.matchNameLabel}>💁‍♀️</Text>}
      <View
        style={[
          styles.bubbleContent,
          isUser ? styles.userBubbleContent : styles.matchBubbleContent,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>{message.text}</Text>
      </View>
    </Animated.View>
  );
}

function SessionSummary({
  session,
  onRestart,
  onBack,
}: {
  session: CoachSession;
  onRestart: () => void;
  onBack: () => void;
}) {
  const avgScore = session.averageScore;
  let grade = 'D';
  let gradeColor = '#FF4757';
  let gradeEmoji = '😬';

  if (avgScore >= 4.5) {
    grade = 'A+';
    gradeColor = '#2ED573';
    gradeEmoji = '🔥';
  } else if (avgScore >= 4) {
    grade = 'A';
    gradeColor = '#2ED573';
    gradeEmoji = '😎';
  } else if (avgScore >= 3.5) {
    grade = 'B+';
    gradeColor = '#FFBE76';
    gradeEmoji = '👍';
  } else if (avgScore >= 3) {
    grade = 'B';
    gradeColor = '#FFBE76';
    gradeEmoji = '😊';
  } else if (avgScore >= 2.5) {
    grade = 'C';
    gradeColor = '#FF8E53';
    gradeEmoji = '🤔';
  }

  return (
    <Animated.View entering={FadeInDown} style={styles.summaryContainer}>
      <Text style={styles.summaryEmoji}>{gradeEmoji}</Text>
      <Text style={styles.summaryGrade}>Grade: {grade}</Text>
      <Text style={[styles.summaryScore, { color: gradeColor }]}>{avgScore.toFixed(1)} / 5.0</Text>
      <Text style={styles.summaryDetail}>{session.messageCount} messages exchanged</Text>
      <View style={styles.summaryButtons}>
        <TouchableOpacity style={styles.summaryBtn} onPress={onRestart}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.summaryBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.summaryBtn, styles.summaryBtnSecondary]} onPress={onBack}>
          <Ionicons name="list" size={20} color={accentColors.coral} />
          <Text style={[styles.summaryBtnText, { color: accentColors.coral }]}>Scenarios</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ==========================================
// Difficulty Filter
// ==========================================

function DifficultyFilter({
  selected,
  onSelect,
}: {
  selected: CoachDifficulty | 'all';
  onSelect: (d: CoachDifficulty | 'all') => void;
}) {
  const options: { key: CoachDifficulty | 'all'; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: accentColors.coral },
    { key: 'easy', label: '💚 Easy', color: '#2ED573' },
    { key: 'medium', label: '💛 Medium', color: '#FFBE76' },
    { key: 'hard', label: '❤️‍🔥 Hard', color: '#FF4757' },
  ];

  return (
    <View style={styles.filterRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.filterChip,
            selected === opt.key && { backgroundColor: opt.color + '22', borderColor: opt.color },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(opt.key);
          }}
        >
          <Text style={[styles.filterChipText, selected === opt.key && { color: opt.color }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ==========================================
// Past Sessions
// ==========================================

function PastSessionCard({ session, onPress }: { session: CoachSession; onPress: () => void }) {
  const info = getDifficultyInfo(session.difficulty);
  const date = new Date(session.startedAt);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={styles.pastSessionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.pastSessionLeft}>
        <Text style={styles.pastSessionName}>{session.matchName}</Text>
        <View style={styles.pastSessionMeta}>
          <View style={[styles.miniDiffBadge, { backgroundColor: info.color + '22' }]}>
            <Text style={[styles.miniDiffText, { color: info.color }]}>{info.label}</Text>
          </View>
          <Text style={styles.pastSessionDate}>{dateStr}</Text>
        </View>
      </View>
      <View style={styles.pastSessionRight}>
        <StarRating score={session.averageScore} />
        <Text style={styles.pastSessionScore}>{session.averageScore.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ==========================================
// Main Screen
// ==========================================

type ScreenMode = 'scenarios' | 'chat' | 'summary' | 'history';

interface Props {
  navigation?: { goBack: () => void };
}

export function CoachScreen({ navigation }: Props) {
  const [mode, setMode] = useState<ScreenMode>('scenarios');
  const [difficultyFilter, setDifficultyFilter] = useState<CoachDifficulty | 'all'>('all');
  const [currentSession, setCurrentSession] = useState<CoachSession | null>(null);
  const [currentScenario, setCurrentScenario] = useState<CoachScenario | null>(null);
  const [inputText, setInputText] = useState('');
  const [pastSessions, setPastSessions] = useState<CoachSession[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSessions().then(setPastSessions);
  }, []);

  const filteredScenarios = COACH_SCENARIOS.filter(
    (s) => difficultyFilter === 'all' || s.difficulty === difficultyFilter
  );

  const handleSelectScenario = useCallback((scenario: CoachScenario) => {
    const session = createSession(scenario);
    setCurrentSession(session);
    setCurrentScenario(scenario);
    setMode('chat');
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !currentSession) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedSession = addUserMessage(currentSession, inputText.trim());
    setCurrentSession(updatedSession);
    setInputText('');

    // Scroll to bottom after messages are added
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, currentSession]);

  const handleEndSession = useCallback(async () => {
    if (!currentSession || currentSession.messageCount === 0) {
      setMode('scenarios');
      return;
    }

    const completed = {
      ...currentSession,
      completedAt: Date.now(),
    };
    setCurrentSession(completed);

    // Save session
    const sessions = await loadSessions();
    sessions.unshift(completed);
    await saveSessions(sessions.slice(0, 50)); // Keep last 50
    setPastSessions(sessions.slice(0, 50));

    setMode('summary');
  }, [currentSession]);

  const handleRestart = useCallback(() => {
    if (currentScenario) {
      const session = createSession(currentScenario);
      setCurrentSession(session);
      setMode('chat');
    }
  }, [currentScenario]);

  // ==========================================
  // Render: Scenarios List
  // ==========================================

  if (mode === 'scenarios') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎯 Coach</Text>
          <TouchableOpacity onPress={() => setMode('history')} style={styles.historyButton}>
            <Ionicons name="time-outline" size={22} color={darkColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Practice your dating conversation skills</Text>

        <DifficultyFilter selected={difficultyFilter} onSelect={setDifficultyFilter} />

        <FlatList
          data={filteredScenarios}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ScenarioCard scenario={item} onSelect={handleSelectScenario} />
          )}
          contentContainerStyle={styles.scenarioList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // ==========================================
  // Render: Past Sessions
  // ==========================================

  if (mode === 'history') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode('scenarios')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📋 Past Sessions</Text>
          <View style={{ width: 40 }} />
        </View>

        {pastSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyDesc}>Complete a practice session to see your history</Text>
          </View>
        ) : (
          <FlatList
            data={pastSessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PastSessionCard
                session={item}
                onPress={() => {
                  setCurrentSession(item);
                  setMode('summary');
                }}
              />
            )}
            contentContainerStyle={styles.scenarioList}
          />
        )}
      </View>
    );
  }

  // ==========================================
  // Render: Summary
  // ==========================================

  if (mode === 'summary' && currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode('scenarios')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session Complete</Text>
          <View style={{ width: 40 }} />
        </View>
        <SessionSummary
          session={currentSession}
          onRestart={handleRestart}
          onBack={() => setMode('scenarios')}
        />
      </View>
    );
  }

  // ==========================================
  // Render: Chat Mode
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={handleEndSession} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{currentSession?.matchName || 'Match'}</Text>
          {currentSession && (
            <View style={styles.chatHeaderBadge}>
              <Text
                style={[
                  styles.chatHeaderDiff,
                  {
                    color: getDifficultyInfo(currentSession.difficulty).color,
                  },
                ]}
              >
                {getDifficultyInfo(currentSession.difficulty).label}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleEndSession} style={styles.endButton}>
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Context Banner */}
      {currentScenario && (
        <View style={styles.contextBanner}>
          <Ionicons name="information-circle" size={16} color={accentColors.coral} />
          <Text style={styles.contextText} numberOfLines={2}>
            {currentScenario.context}
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={currentSession?.messages || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessageBubble message={item} />}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type your response..."
          placeholderTextColor={darkColors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() ? '#FFF' : darkColors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: fonts.bold,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: darkColors.border,
    backgroundColor: darkColors.surface,
  },
  filterChipText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    fontFamily: fonts.medium,
  },
  // Scenarios
  scenarioList: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  scenarioCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioEmoji: {
    fontSize: 24,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  difficultyText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  scenarioTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
    fontFamily: fonts.semiBold,
  },
  scenarioDesc: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    marginBottom: 8,
    fontFamily: fonts.regular,
  },
  scenarioMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenarioMatchName: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    fontFamily: fonts.medium,
  },
  // Chat
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
    backgroundColor: darkColors.surface,
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatHeaderName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: fonts.semiBold,
  },
  chatHeaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.background,
  },
  chatHeaderDiff: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  endButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: accentColors.coral + '22',
  },
  endButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: accentColors.coral,
    fontFamily: fonts.semiBold,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
    gap: 8,
  },
  contextText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    fontFamily: fonts.regular,
  },
  chatList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  // Message Bubbles
  messageBubble: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  matchBubble: {
    justifyContent: 'flex-start',
  },
  matchNameLabel: {
    fontSize: 18,
    marginRight: 6,
    marginBottom: 2,
  },
  bubbleContent: {
    maxWidth: SCREEN_WIDTH * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubbleContent: {
    backgroundColor: accentColors.coral,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  matchBubbleContent: {
    backgroundColor: darkColors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  messageText: {
    fontSize: fontSizes.md,
    color: '#FFF',
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  userMessageText: {
    color: '#FFF',
  },
  // Coach Feedback
  coachCard: {
    backgroundColor: accentColors.coral + '11',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: accentColors.coral + '33',
    borderLeftWidth: 3,
    borderLeftColor: accentColors.coral,
    marginHorizontal: spacing.xs,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coachLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: accentColors.coral,
    flex: 1,
    fontFamily: fonts.semiBold,
  },
  coachText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    backgroundColor: darkColors.surface,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: darkColors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: fontSizes.md,
    maxHeight: 100,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: accentColors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: darkColors.border,
  },
  // Past Sessions
  pastSessionCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastSessionLeft: {
    flex: 1,
  },
  pastSessionName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
    fontFamily: fonts.semiBold,
  },
  pastSessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniDiffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  miniDiffText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  pastSessionDate: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    fontFamily: fonts.regular,
  },
  pastSessionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pastSessionScore: {
    fontSize: fontSizes.xs,
    color: darkColors.textSecondary,
    fontFamily: fonts.medium,
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    fontFamily: fonts.semiBold,
  },
  emptyDesc: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  // Summary
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  summaryEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  summaryGrade: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    fontFamily: fonts.extraBold,
  },
  summaryScore: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
    fontFamily: fonts.semiBold,
  },
  summaryDetail: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    marginBottom: spacing.xl,
    fontFamily: fonts.regular,
  },
  summaryButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: accentColors.coral,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.full,
  },
  summaryBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: accentColors.coral,
  },
  summaryBtnText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: fonts.semiBold,
  },
});
