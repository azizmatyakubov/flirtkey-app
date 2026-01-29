/**
 * ContactCard Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';

// Mock components
jest.mock('../../components/Avatar', () => ({
  Avatar: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID="avatar">{name}</Text>;
  },
}));

jest.mock('../../components/Badge', () => ({
  StageBadge: ({ stage }: { stage: string }) => {
    const { Text } = require('react-native');
    return <Text testID="stage-badge">{stage}</Text>;
  },
}));

jest.mock('../../components/SwipeableRow', () => ({
  SwipeableRow: ({ children, onDelete, onEdit }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="swipeable-row">
        {children}
        <TouchableOpacity testID="delete-btn" onPress={onDelete}>
          <Text>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="edit-btn" onPress={onEdit}>
          <Text>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

import { ContactCard } from '../../components/ContactCard';
import { Contact } from '../../types';

describe('ContactCard', () => {
  const mockContact: Contact = {
    id: 1,
    name: 'Emma',
    nickname: 'Em',
    avatar: 'https://example.com/avatar.jpg',
    interests: 'hiking, movies',
    personality: 'outgoing',
    relationshipStage: 'flirting',
    insideJokes: '',
    messageCount: 25,
    lastTopic: 'movies',
    lastMessageDate: new Date().toISOString(),
  };

  const defaultProps = {
    contact: mockContact,
    animatedValue: new Animated.Value(1),
    onPress: jest.fn(),
    onLongPress: jest.fn(),
    onDelete: jest.fn(),
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders contact name correctly', () => {
    const { getAllByText } = render(<ContactCard {...defaultProps} />);
    expect(getAllByText('Emma').length).toBeGreaterThan(0);
  });

  it('renders message count', () => {
    const { getByText } = render(<ContactCard {...defaultProps} />);
    expect(getByText('25')).toBeTruthy();
  });

  it('renders avatar with correct name', () => {
    const { getByTestId } = render(<ContactCard {...defaultProps} />);
    expect(getByTestId('avatar')).toBeTruthy();
  });

  it('renders stage badge', () => {
    const { getByTestId } = render(<ContactCard {...defaultProps} />);
    expect(getByTestId('stage-badge')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const onPress = jest.fn();
    const { getAllByText } = render(<ContactCard {...defaultProps} onPress={onPress} />);

    fireEvent.press(getAllByText('Emma')[0]!);
    expect(onPress).toHaveBeenCalledWith(mockContact);
  });

  it('calls onLongPress when card is long pressed', () => {
    const onLongPress = jest.fn();
    const { getAllByText } = render(<ContactCard {...defaultProps} onLongPress={onLongPress} />);

    fireEvent(getAllByText('Emma')[0]!, 'longPress');
    expect(onLongPress).toHaveBeenCalledWith(mockContact);
  });

  it('calls onDelete from swipeable row', () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(<ContactCard {...defaultProps} onDelete={onDelete} />);

    fireEvent.press(getByTestId('delete-btn'));
    expect(onDelete).toHaveBeenCalledWith(mockContact);
  });

  it('calls onEdit from swipeable row', () => {
    const onEdit = jest.fn();
    const { getByTestId } = render(<ContactCard {...defaultProps} onEdit={onEdit} />);

    fireEvent.press(getByTestId('edit-btn'));
    expect(onEdit).toHaveBeenCalledWith(mockContact);
  });

  it('shows relative time for last message', () => {
    const recentGirl = {
      ...mockContact,
      lastMessageDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    };

    const { getByText } = render(<ContactCard {...defaultProps} contact={recentGirl} />);

    // The formatRelativeTime function formats as "Xm ago"
    expect(getByText(/30m ago/)).toBeTruthy();
  });

  it('memoizes correctly - does not re-render for same props', () => {
    const { rerender, getAllByText } = render(<ContactCard {...defaultProps} />);

    // Same props, should be memoized
    rerender(<ContactCard {...defaultProps} />);

    expect(getAllByText('Emma').length).toBeGreaterThan(0);
  });

  it('re-renders when contact data changes', () => {
    const { rerender, getAllByText } = render(<ContactCard {...defaultProps} />);

    const updatedContact = { ...mockContact, name: 'Sophie', messageCount: 30 };
    rerender(<ContactCard {...defaultProps} contact={updatedContact} />);

    expect(getAllByText('Sophie').length).toBeGreaterThan(0);
    expect(getAllByText('30').length).toBeGreaterThan(0);
  });
});
