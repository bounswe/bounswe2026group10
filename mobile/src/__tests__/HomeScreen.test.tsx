import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { HomeScreen } from '../screens/HomeScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockCommunityPicks = [
  {
    id: 'pick-001',
    title: 'Test Recipe',
    type: 'community' as const,
    averageRating: 4.5,
    ratingCount: 10,
    creatorId: 'u1',
    creatorUsername: 'chef_test',
    dishVarietyId: 1,
    dishVarietyName: 'Test Variety',
    genreName: 'Soups',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const mockGenres = [
  { id: 1, name: 'Soups', description: null, varieties: [] },
  { id: 2, name: 'Kebabs', description: null, varieties: [] },
];

const mockFetchCommunityPicks = jest.fn();
const mockFetchGenres = jest.fn();

jest.mock('../api/home', () => ({
  fetchCommunityPicks: (...args: any[]) => mockFetchCommunityPicks(...args),
  fetchGenres: (...args: any[]) => mockFetchGenres(...args),
}));

const mockUseAuth = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderAndFlush() {
  const result = render(<HomeScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchCommunityPicks.mockResolvedValue({
      recipes: mockCommunityPicks,
      pagination: { page: 1, limit: 10, total: 1 },
    });
    mockFetchGenres.mockResolvedValue(mockGenres);
    mockUseAuth.mockReturnValue({
      authState: { status: 'unauthenticated', isGuest: false },
    });
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('shows the Discover header when unauthenticated', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Discover')).toBeTruthy();
    });

    it('shows personalized greeting when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        authState: {
          status: 'authenticated',
          user: { userId: 'u1', username: 'TestUser', email: 't@t.com', role: 'cook', accessToken: 'a', refreshToken: 'r' },
        },
      });
      const { getByText } = await renderAndFlush();
      expect(getByText('Hi, TestUser!')).toBeTruthy();
    });

    it('shows Community Picks section header', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Community Picks')).toBeTruthy();
    });

    it('shows Browse by Genre section header', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Browse by Genre')).toBeTruthy();
    });

    it('renders community pick recipe cards', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Test Recipe')).toBeTruthy();
    });

    it('renders genre cards', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Soups')).toBeTruthy();
      expect(getByText('Kebabs')).toBeTruthy();
    });

    it('shows creator username on recipe cards', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('chef_test')).toBeTruthy();
    });
  });

  // ─── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty message when no recipes are returned', async () => {
      mockFetchCommunityPicks.mockResolvedValueOnce({
        recipes: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });
      const { getByText } = await renderAndFlush();
      expect(getByText('No recipes yet — check back soon!')).toBeTruthy();
    });

    it('shows empty message when no genres are returned', async () => {
      mockFetchGenres.mockResolvedValueOnce([]);
      const { getByText } = await renderAndFlush();
      expect(getByText('No genres available')).toBeTruthy();
    });
  });

  // ─── Data fetching ──────────────────────────────────────────────────────────

  describe('data fetching', () => {
    it('calls fetchCommunityPicks and fetchGenres on mount', async () => {
      await renderAndFlush();
      expect(mockFetchCommunityPicks).toHaveBeenCalledTimes(1);
      expect(mockFetchGenres).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('navigates to RecipeDetail when a community pick is pressed', async () => {
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('Test Recipe'));
      expect(mockNavigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: 'pick-001' });
    });

    it('navigates to SearchTab with initialQuery when a genre is pressed', async () => {
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('Soups'));
      expect(mockNavigate).toHaveBeenCalledWith('SearchTab', {
        screen: 'Search',
        params: { initialQuery: 'Soups' },
      });
    });

    it('navigates to SearchTab with correct genre name when Kebabs is pressed', async () => {
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('Kebabs'));
      expect(mockNavigate).toHaveBeenCalledWith('SearchTab', {
        screen: 'Search',
        params: { initialQuery: 'Kebabs' },
      });
    });
  });
});
