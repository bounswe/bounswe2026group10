import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { DishVarietyDetailScreen } from '../screens/DishVarietyDetailScreen';
import * as client from '../api/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({ params: { id: 42 } }),
}));

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = client.fetchApi as jest.MockedFunction<typeof client.fetchApi>;

// ─── Test data ────────────────────────────────────────────────────────────────

const mockVariety = {
  id: 42,
  name: 'Adana Kebap',
  description: 'Spicy minced meat kebab from Adana',
  genre: { id: 2, name: 'Kebabs' },
  recipes: [
    {
      id: 'r-cultural',
      title: 'Traditional Adana Kebap',
      type: 'cultural' as const,
      averageRating: 4.8,
      ratingCount: 35,
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'r-community',
      title: 'Home Style Adana',
      type: 'community' as const,
      averageRating: 4.2,
      ratingCount: 12,
      createdAt: '2025-02-01T00:00:00Z',
    },
  ],
};

const mockCulturalRecipeDetail = {
  id: 'r-cultural',
  title: 'Traditional Adana Kebap',
  story: 'A heritage recipe from southeastern Turkey.',
  media: [{ type: 'image' as const, url: 'https://example.com/adana.jpg' }],
  profile: { username: 'master_chef' },
};

const mockCommunityRecipeDetail = {
  id: 'r-community',
  title: 'Home Style Adana',
  story: null,
  media: [],
  profile: { username: 'home_cook' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderAndFlush() {
  const result = render(<DishVarietyDetailScreen />);
  await act(async () => { await Promise.resolve(); });
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DishVarietyDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchApi.mockImplementation((path: string) => {
      if (path === '/dish-varieties/42') return Promise.resolve(mockVariety);
      if (path === '/recipes/r-cultural') return Promise.resolve(mockCulturalRecipeDetail);
      if (path === '/recipes/r-community') return Promise.resolve(mockCommunityRecipeDetail);
      return Promise.reject(new Error('Unknown path'));
    });
  });

  // ─── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows activity indicator while loading', () => {
      const { UNSAFE_getByType } = render(<DishVarietyDetailScreen />);
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering after load', () => {
    it('shows variety name', async () => {
      const { getAllByText } = await renderAndFlush();
      expect(getAllByText('Adana Kebap').length).toBeGreaterThanOrEqual(1);
    });

    it('shows variety description', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Spicy minced meat kebab from Adana')).toBeTruthy();
    });

    it('shows genre chip', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Kebabs')).toBeTruthy();
    });

    it('shows cultural spotlight section', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('CULTURAL SPOTLIGHT')).toBeTruthy();
      expect(getByText('Traditional Adana Kebap')).toBeTruthy();
    });

    it('shows community recipes section', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Community Recipes')).toBeTruthy();
      expect(getByText('Home Style Adana')).toBeTruthy();
    });

    it('shows recipes count in section title', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('2 Recipes')).toBeTruthy();
    });
  });

  // ─── Error state ───────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));
      const { getByText } = await renderAndFlush();
      expect(getByText('Failed to load dish variety')).toBeTruthy();
    });
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('calls goBack when back button is pressed', async () => {
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('Back'));
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('navigates to RecipeDetail when View Recipe is pressed on cultural spotlight', async () => {
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('View Recipe'));
      expect(mockNavigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: 'r-cultural' });
    });

    it('navigates to RecipeDetail when a community recipe is pressed', async () => {
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('Home Style Adana'));
      expect(mockNavigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: 'r-community' });
    });
  });
});
