import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RecipeHeader } from '../components/recipe-detail/RecipeHeader';
import type { User } from '../types/user';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const author: User = {
  id: 'u1',
  firstName: 'Elif',
  lastName: 'Yilmaz',
  email: 'elif@example.com',
  role: 'EXPERT',
  region: 'Turkey',
  preferredLanguage: 'tr',
  memberSince: '2025-01-01T00:00:00Z',
};

function renderHeader(overrides: Partial<React.ComponentProps<typeof RecipeHeader>> = {}) {
  const props: React.ComponentProps<typeof RecipeHeader> = {
    title: 'Adana Kebap',
    author,
    rating: 4.5,
    ratingCount: 10,
    type: 'CULTURAL',
    region: 'Adana, Turkey',
    dishVarietyName: 'Adana Kebap',
    tags: [],
    allergens: [],
    isFavorited: false,
    onToggleFavorite: jest.fn(),
    favoriteBusy: false,
    ...overrides,
  };
  return { ...render(<RecipeHeader {...props} />), props };
}

describe('RecipeHeader badge row', () => {
  it('renders dish variety badge with a long name', () => {
    const { getByText } = renderHeader({
      dishVarietyName: 'Geleneksel Mercimek Çorbası',
    });
    expect(getByText('Geleneksel Mercimek Çorbası')).toBeTruthy();
  });

  it('renders type, region, and dishVarietyName badges together', () => {
    const { getByText } = renderHeader({
      type: 'CULTURAL',
      region: 'Adana, Turkey',
      dishVarietyName: 'Mercimek Çorbası',
    });
    expect(getByText('CULTURAL')).toBeTruthy();
    expect(getByText('Adana, Turkey')).toBeTruthy();
    expect(getByText('Mercimek Çorbası')).toBeTruthy();
  });

  it('does not render region badge when region is empty', () => {
    const { queryByText } = renderHeader({ region: '' });
    expect(queryByText('Adana, Turkey')).toBeNull();
  });

  it('does not render dishVarietyName badge when absent', () => {
    const { queryByText } = renderHeader({
      title: 'Some Recipe',
      dishVarietyName: undefined,
    });
    expect(queryByText('Mercimek Çorbası')).toBeNull();
  });
});

describe('RecipeHeader favorite button', () => {
  it('renders the heart-outline icon when not favorited', () => {
    const { UNSAFE_getAllByType } = renderHeader({ isFavorited: false });
    const icons = UNSAFE_getAllByType('MaterialCommunityIcons' as any);
    const names = icons.map((i: any) => i.props.name);
    expect(names).toContain('heart-outline');
    expect(names).not.toContain('heart');
  });

  it('renders the filled heart icon when favorited', () => {
    const { UNSAFE_getAllByType } = renderHeader({ isFavorited: true });
    const icons = UNSAFE_getAllByType('MaterialCommunityIcons' as any);
    const names = icons.map((i: any) => i.props.name);
    expect(names).toContain('heart');
    expect(names).not.toContain('heart-outline');
  });

  it('calls onToggleFavorite when the heart button is pressed', () => {
    const onToggleFavorite = jest.fn();
    const { getByLabelText } = renderHeader({
      isFavorited: false,
      onToggleFavorite,
    });
    fireEvent.press(getByLabelText('Add to favorites'));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('uses the unfavorite a11y label when already favorited', () => {
    const { getByLabelText } = renderHeader({ isFavorited: true });
    expect(getByLabelText('Remove from favorites')).toBeTruthy();
  });

  it('does not fire onToggleFavorite while favoriteBusy is true', () => {
    const onToggleFavorite = jest.fn();
    const { getByLabelText } = renderHeader({
      isFavorited: false,
      onToggleFavorite,
      favoriteBusy: true,
    });
    fireEvent.press(getByLabelText('Add to favorites'));
    expect(onToggleFavorite).not.toHaveBeenCalled();
  });
});
