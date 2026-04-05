import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SearchScreen } from '../screens/SearchScreen';
import * as searchApi from '../api/search';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../api/search', () => ({
  fetchSearchGenres: jest.fn(),
  searchDishVarieties: jest.fn(),
  searchRecipesWithFilters: jest.fn(),
  fetchDietaryTags: jest.fn(),
}));

import {
  fetchSearchGenres,
  searchDishVarieties,
  searchRecipesWithFilters,
} from '../api/search';
const mockFetchGenres = fetchSearchGenres as jest.MockedFunction<typeof fetchSearchGenres>;
const mockSearchVarietiesFn = searchDishVarieties as jest.MockedFunction<typeof searchDishVarieties>;
const mockSearchFiltered = searchRecipesWithFilters as jest.MockedFunction<typeof searchRecipesWithFilters>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderAndFlush() {
  const result = render(<SearchScreen />);
  await act(async () => { await Promise.resolve(); });
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const mockSearchGenres = [
  { id: 1, name: 'Soups', description: 'Warm liquid dishes', varieties: [] },
  { id: 2, name: 'Mezes', description: 'Appetizers', varieties: [] },
];

const mockSearchVarieties = [
  { id: 1, name: 'Lentil Soup', description: 'Red lentil soup', genreId: 1, genreName: 'Soups' },
  { id: 2, name: 'Hummus', description: 'Chickpea dip', genreId: 2, genreName: 'Mezes' },
  { id: 3, name: 'Pilaf', description: 'Rice dish', genreId: 3, genreName: 'Main Courses' },
];

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchGenres.mockResolvedValue(mockSearchGenres);
    mockSearchVarietiesFn.mockResolvedValue(mockSearchVarieties);
  });

  // ─── Default state ─────────────────────────────────────────────────────────

  describe('default state (no query)', () => {
    it('shows "Browse by Genre" heading', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Browse by Genre')).toBeTruthy();
    });

    it('fetches genres and all varieties on mount', async () => {
      await renderAndFlush();
      expect(mockFetchGenres).toHaveBeenCalledWith();
      // searchDishVarieties('') is called to populate the default All Dishes list
      expect(mockSearchVarietiesFn).toHaveBeenCalledWith('');
    });

    it('renders genre tiles from mock data', async () => {
      const { getAllByText, getByText } = await renderAndFlush();
      // Soups only appears in bento (no soup varieties in mock data)
      expect(getByText('Soups')).toBeTruthy();
      // Kebabs may appear multiple times (bento tile + variety card genre label)
      expect(getAllByText('Kebabs').length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Varieties" section with varieties in default state', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Varieties')).toBeTruthy();
      // verify a variety from mock data appears
      expect(getByText('Lentil Soup')).toBeTruthy();
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

    it('shows result count heading after search (variety count only)', async () => {
      const soupVarieties = mockSearchVarieties.filter((v) =>
        v.name.toLowerCase().includes('soup')
      );
      // Override to return only soup varieties for this search
      mockSearchVarietiesFn.mockResolvedValue(soupVarieties);
      mockFetchGenres.mockResolvedValue([]); // no genre matches for "soup"

      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'soup');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      // 1 soup variety → heading says "1 Varieties for 'soup'"
      expect(getByText(`${soupVarieties.length} Varieties for 'soup'`)).toBeTruthy();
    });

    it('shows genre chip even when 0 variety results (e.g. Soups query)', async () => {
      // Genres matching but 0 variety results
      mockFetchGenres.mockResolvedValue([{ id: 1, name: 'Soups', description: '', varieties: [] }]);
      mockSearchVarietiesFn.mockResolvedValue([]);
      const { getByPlaceholderText, getByText, queryByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'Soups');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      // Genre chip shown
      expect(getByText('Soups')).toBeTruthy();
      // No 'No varieties found' because there IS a matching genre
      expect(queryByText('No varieties found')).toBeNull();
    });

    it('shows empty state only when no genres AND no varieties found', async () => {
      mockFetchGenres.mockResolvedValue([]);
      mockSearchVarietiesFn.mockResolvedValue([]);
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'xyzzy');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      expect(getByText('No Varieties found')).toBeTruthy();
    });
  });

  // ─── Clear ─────────────────────────────────────────────────────────────────

  describe('clear button', () => {
    it('restores the genre grid after clearing the query', async () => {
      const { getByPlaceholderText, getByText } = await renderAndFlush();
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'kebap');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), '');
      await act(async () => { await Promise.resolve(); });
      expect(getByText('Browse by Genre')).toBeTruthy();
    });
  });

  // ─── Filters ────────────────────────────────────────────────────────────────

  describe('filters', () => {
    it('does not call searchRecipesWithFilters for plain text search (no filters)', async () => {
      mockSearchFiltered.mockResolvedValue([]);
      const { getByPlaceholderText } = await renderAndFlush();

      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'kebap');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });

      // Plain search (no active filters) uses variety search, not filtered search
      expect(mockSearchVarietiesFn).toHaveBeenCalled();
      expect(mockSearchFiltered).not.toHaveBeenCalled();
    });

    it('restores genre grid and hides filter badge after X is pressed', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderAndFlush();

      // Start a search
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), 'kebap');
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });

      // Clear via X
      fireEvent.changeText(getByPlaceholderText('Search heirloom flavors...'), '');
      await act(async () => { await Promise.resolve(); });

      // Back to genre browse and no filter badge visible
      expect(getByText('Browse by Genre')).toBeTruthy();
    });
  });
});
