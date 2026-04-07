import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { SearchScreen } from '../screens/SearchScreen';
import * as searchApi from '../api/search';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = jest.fn();
const mockRouteParams: { initialQuery?: string } = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams }),
  RouteProp: {},
}));

jest.mock('../api/search', () => ({
  fetchSearchGenres: jest.fn(),
  searchDishVarieties: jest.fn(),
  fetchDiscoveryRecipes: jest.fn(),
  fetchDietaryTags: jest.fn(),
  fetchLocations: jest.fn(),
}));

import {
  fetchSearchGenres,
  searchDishVarieties,
  fetchDiscoveryRecipes,
} from '../api/search';
const mockFetchGenres = fetchSearchGenres as jest.MockedFunction<typeof fetchSearchGenres>;
const mockSearchVarietiesFn = searchDishVarieties as jest.MockedFunction<typeof searchDishVarieties>;
const mockFetchDiscovery = fetchDiscoveryRecipes as jest.MockedFunction<typeof fetchDiscoveryRecipes>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderAndFlush() {
  const result = render(<SearchScreen />);
  // Wait until the loading spinner disappears (default data loaded)
  await waitFor(() => result.getByText('Genres'), { timeout: 3000 });
  return result;
}

// ─── Test data ────────────────────────────────────────────────────────────────

const mockSearchGenres = [
  { id: 1, name: 'Soups', description: 'Warm liquid dishes', varieties: [] },
  { id: 2, name: 'Mezes', description: 'Appetizers', varieties: [] },
];

const mockSearchVarieties = [
  { id: 1, name: 'Lentil Soup', description: 'Red lentil soup', genreId: 1, genreName: 'Soups' },
  { id: 2, name: 'Hummus', description: 'Chickpea dip', genreId: 2, genreName: 'Mezes' },
  { id: 3, name: 'Pilaf', description: 'Rice dish', genreId: 3, genreName: 'Main Courses' },
];

const mockRecipes = [
  {
    id: 'r1',
    title: 'Classic Lentil Soup',
    creatorUsername: 'chef1',
    averageRating: 4.5,
    ratingCount: 10,
    dishVarietyId: 1,
    varietyName: 'Lentil Soup',
    recipeType: 'community' as const,
    imageUrl: null,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.initialQuery = undefined;
    mockFetchGenres.mockResolvedValue(mockSearchGenres);
    mockSearchVarietiesFn.mockResolvedValue(mockSearchVarieties);
    mockFetchDiscovery.mockResolvedValue(mockRecipes);
  });

  // ─── Default state ─────────────────────────────────────────────────────────

  describe('default state (no query)', () => {
    it('shows "Genres" section heading', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Genres')).toBeTruthy();
    });

    it('fetches genres and all varieties on mount', async () => {
      await renderAndFlush();
      expect(mockFetchGenres).toHaveBeenCalledWith();
      expect(mockSearchVarietiesFn).toHaveBeenCalledWith('');
    });

    it('calls fetchDiscoveryRecipes on mount with no params', async () => {
      await renderAndFlush();
      expect(mockFetchDiscovery).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined, genreId: undefined })
      );
    });

    it('renders genre tiles from mock data', async () => {
      const { getAllByText } = await renderAndFlush();
      expect(getAllByText('Soups').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Mezes').length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Varieties" section with varieties in default state', async () => {
      const { getByText, getAllByText } = await renderAndFlush();
      expect(getByText('Varieties')).toBeTruthy();
      expect(getAllByText('Lentil Soup').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── initialQuery from route params ────────────────────────────────────────

  describe('initialQuery from route params', () => {
    it('pre-fills search bar when initialQuery is provided', async () => {
      mockRouteParams.initialQuery = 'Soups';
      mockFetchGenres.mockResolvedValue([{ id: 1, name: 'Soups', description: '', varieties: [] }]);
      mockSearchVarietiesFn.mockResolvedValue([]);
      const result = render(<SearchScreen />);
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      expect(result.getByDisplayValue('Soups')).toBeTruthy();
    });
  });

  // ─── Active search state ───────────────────────────────────────────────────

  describe('active search state', () => {
    it('shows sort row when query is entered', async () => {
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'kebap');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      expect(getByText('Best Rating')).toBeTruthy();
      expect(getByText('Most Recent')).toBeTruthy();
    });

    it('passes search text directly to fetchDiscoveryRecipes (no variety resolution)', async () => {
      const { getByPlaceholderText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'lentil');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      expect(mockFetchDiscovery).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'lentil' })
      );
      // Should NOT have called searchDishVarieties with the query text
      const varietyCalls = mockSearchVarietiesFn.mock.calls.filter(([q]) => q === 'lentil');
      expect(varietyCalls.length).toBe(0);
    });

    it('shows 0 count in section heading when no results found', async () => {
      mockFetchGenres.mockResolvedValue([]);
      mockSearchVarietiesFn.mockResolvedValue([]);
      mockFetchDiscovery.mockResolvedValue([]);
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'xyzzy');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      expect(getByText(`0 Varieties for "xyzzy"`)).toBeTruthy();
    });
  });

  // ─── Genre selection ───────────────────────────────────────────────────────

  describe('genre selection', () => {
    it('passes genreId to fetchDiscoveryRecipes when genre chip pressed in search mode', async () => {
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      // Enter search to show genre chips
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'Soups');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      // Press the "Soups" genre chip
      const soupEls = await waitFor(() => {
        const all = [];
        try { all.push(getByText('Soups')); } catch {}
        return all;
      });
      if (soupEls.length > 0) {
        fireEvent.press(soupEls[0]);
        await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
        expect(mockFetchDiscovery).toHaveBeenCalledWith(
          expect.objectContaining({ genreId: 1 })
        );
      }
    });
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('navigates to DishVarietyDetail when a variety is pressed', async () => {
      const { getAllByText } = await renderAndFlush();
      fireEvent.press(getAllByText('Lentil Soup')[0]);
      expect(mockNavigate).toHaveBeenCalledWith('DishVarietyDetail', { id: 1 });
    });

    it('navigates to RecipeDetail when a recipe is pressed', async () => {
      mockFetchDiscovery.mockResolvedValue(mockRecipes);
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'lentil');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      fireEvent.press(getByText('Classic Lentil Soup'));
      expect(mockNavigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: 'r1' });
    });
  });

  // ─── Clear ─────────────────────────────────────────────────────────────────

  describe('clear button', () => {
    it('restores sections after clearing the query', async () => {
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'kebap');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), '');
      await waitFor(() => getByText('Genres'));
    });
  });

  // ─── Filters ────────────────────────────────────────────────────────────────

  describe('filters', () => {
    it('calls fetchDiscoveryRecipes on search (not the old two-step flow)', async () => {
      const { getByPlaceholderText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'kebap');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      expect(mockFetchDiscovery).toHaveBeenCalled();
    });

    it('restores genre grid after clearing search', async () => {
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'kebap');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), '');
      await waitFor(() => getByText('Genres'));
    });
  });
});
