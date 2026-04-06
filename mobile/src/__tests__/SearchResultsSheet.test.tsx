import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SearchResultsSheet } from '../components/search/SearchResultsSheet';

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
  NativeStackNavigationProp: {},
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const mockGenres = [
  { id: 1, name: 'Soups', description: 'Warm dishes', varieties: [] },
  { id: 2, name: 'Kebabs', description: 'Grilled meats', varieties: [] },
];

const mockVarieties = [
  { id: 10, name: 'Lentil Soup', description: 'Red lentil', genreId: 1, genreName: 'Soups' },
  { id: 11, name: 'Adana Kebap', description: 'Spicy kebab', genreId: 2, genreName: 'Kebabs' },
];

const mockRecipes = [
  {
    id: 'r1',
    title: 'Classic Lentil Soup',
    creatorUsername: 'chef1',
    averageRating: 4.5,
    ratingCount: 10,
    dishVarietyId: 10,
    varietyName: 'Lentil Soup',
    recipeType: 'community' as const,
    imageUrl: null,
  },
  {
    id: 'r2',
    title: 'Spicy Adana',
    creatorUsername: 'chef2',
    averageRating: 4.8,
    ratingCount: 20,
    dishVarietyId: 11,
    varietyName: 'Adana Kebap',
    recipeType: 'cultural' as const,
    imageUrl: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  query: 'soup',
  genres: mockGenres,
  varieties: mockVarieties,
  recipes: mockRecipes,
  onGenrePress: jest.fn(),
  onVarietyPress: jest.fn(),
};

async function renderSheet(section: 'genres' | 'varieties' | 'recipes', overrides = {}) {
  const result = render(
    <SearchResultsSheet {...defaultProps} section={section} {...overrides} />
  );
  await act(async () => { await Promise.resolve(); });
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SearchResultsSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Genres section ────────────────────────────────────────────────────────

  describe('genres section', () => {
    it('renders genre names', async () => {
      const { getByText } = await renderSheet('genres');
      expect(getByText('Soups')).toBeTruthy();
      expect(getByText('Kebabs')).toBeTruthy();
    });

    it('calls onGenrePress and onClose when a genre is pressed', async () => {
      const onGenrePress = jest.fn();
      const onClose = jest.fn();
      const { getByText } = await renderSheet('genres', { onGenrePress, onClose });
      fireEvent.press(getByText('Soups'));
      expect(onGenrePress).toHaveBeenCalledWith(mockGenres[0]);
      expect(onClose).toHaveBeenCalled();
    });

    it('shows empty state when genres list is empty', async () => {
      const { getByText } = await renderSheet('genres', { genres: [] });
      expect(getByText('No Genres found')).toBeTruthy();
    });
  });

  // ─── Varieties section ─────────────────────────────────────────────────────

  describe('varieties section', () => {
    it('renders variety names', async () => {
      const { getByText } = await renderSheet('varieties');
      expect(getByText('Lentil Soup')).toBeTruthy();
      expect(getByText('Adana Kebap')).toBeTruthy();
    });

    it('calls onVarietyPress when a variety card is pressed', async () => {
      const onVarietyPress = jest.fn();
      const { getByText } = await renderSheet('varieties', { onVarietyPress });
      fireEvent.press(getByText('Lentil Soup'));
      expect(onVarietyPress).toHaveBeenCalledWith(mockVarieties[0]);
    });

    it('shows empty state when varieties list is empty', async () => {
      const { getByText } = await renderSheet('varieties', { varieties: [] });
      expect(getByText('No Varieties found')).toBeTruthy();
    });
  });

  // ─── Recipes section ───────────────────────────────────────────────────────

  describe('recipes section', () => {
    it('renders recipe titles', async () => {
      const { getByText } = await renderSheet('recipes');
      expect(getByText('Classic Lentil Soup')).toBeTruthy();
      expect(getByText('Spicy Adana')).toBeTruthy();
    });

    it('navigates to RecipeDetail and closes sheet when recipe is pressed', async () => {
      const onClose = jest.fn();
      const { getByText } = await renderSheet('recipes', { onClose });
      fireEvent.press(getByText('Classic Lentil Soup'));
      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: 'r1' });
    });

    it('shows empty state when recipes list is empty', async () => {
      const { getByText } = await renderSheet('recipes', { recipes: [] });
      expect(getByText('No Recipes found')).toBeTruthy();
    });
  });

  // ─── Heading ───────────────────────────────────────────────────────────────

  describe('heading', () => {
    it('shows result count heading in search mode', async () => {
      const { getByText } = await renderSheet('recipes');
      expect(getByText(`${mockRecipes.length} Recipes for "soup"`)).toBeTruthy();
    });

    it('shows plain label when no query', async () => {
      const { getByText } = await renderSheet('varieties', { query: '' });
      expect(getByText('Varieties')).toBeTruthy();
    });
  });

  // ─── Close button ──────────────────────────────────────────────────────────

  describe('close button', () => {
    it('calls onClose when back arrow is pressed', async () => {
      const onClose = jest.fn();
      const { UNSAFE_getAllByType } = await renderSheet('genres', { onClose });
      const icons = UNSAFE_getAllByType('MaterialCommunityIcons' as any);
      const backIcon = icons.find((i: any) => i.props.name === 'arrow-left');
      fireEvent.press(backIcon!.parent!);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
