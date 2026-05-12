import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { MyLibraryScreen } from '../screens/MyLibraryScreen';
import * as RecipeFormContext from '../context/RecipeFormContext';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = jest.fn();
const mockGetParent = jest.fn(() => ({ navigate: jest.fn() }));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    getParent: mockGetParent,
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.title) return `${key}:${opts.title}`;
      if (opts?.name) return `${key}:${opts.name}`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

const mockGetMyRecipes = jest.fn();
const mockGetFavorites = jest.fn();
const mockGetRecipeById = jest.fn();
const mockDeleteRecipe = jest.fn();

jest.mock('../api/recipes', () => ({
  getMyRecipes: (...args: unknown[]) => mockGetMyRecipes(...args),
  getFavorites: (...args: unknown[]) => mockGetFavorites(...args),
  getRecipeById: (...args: unknown[]) => mockGetRecipeById(...args),
  deleteRecipe: (...args: unknown[]) => mockDeleteRecipe(...args),
}));

jest.mock('../utils/draftHelpers', () => ({
  mapBackendToDraft: jest.fn((recipe) => ({ recipeId: recipe.id, title: recipe.title })),
}));

const mockUpdateDraft = jest.fn();

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const publishedRecipe = {
  id: 'recipe-pub-1',
  title: 'Published Recipe',
  type: 'community' as const,
  isPublished: true,
  averageRating: 4.2,
  ratingCount: 5,
  createdAt: '2025-01-01T00:00:00Z',
  coverImageUrl: null,
  country: 'Turkey',
  city: 'Istanbul',
};

const draftRecipe = {
  id: 'recipe-draft-1',
  title: 'Draft Recipe',
  type: 'community' as const,
  isPublished: false,
  averageRating: null,
  ratingCount: 0,
  createdAt: '2025-01-02T00:00:00Z',
  coverImageUrl: null,
  country: null,
  city: null,
};

const backendDetail = {
  id: 'recipe-pub-1',
  title: 'Published Recipe',
  type: 'community',
  tags: [],
  allergens: [],
  country: 'Turkey',
  city: 'Istanbul',
  district: '',
  dishVarietyId: 1,
  story: '',
  servingSize: 4,
  ingredients: [],
  tools: [],
  media: [],
  steps: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderAndFlush() {
  const result = render(<MyLibraryScreen />);
  await waitFor(() => expect(mockGetMyRecipes).toHaveBeenCalled());
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MyLibraryScreen — edit recipe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyRecipes.mockResolvedValue([publishedRecipe, draftRecipe]);
    mockGetFavorites.mockResolvedValue({ recipes: [] });
    mockGetRecipeById.mockResolvedValue(backendDetail);

    jest.spyOn(RecipeFormContext, 'useRecipeForm').mockReturnValue({
      draft: {} as any,
      updateDraft: mockUpdateDraft,
      resetDraft: jest.fn(),
      saveDraft: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders Edit button for each recipe card', async () => {
    const { getAllByText } = await renderAndFlush();
    const editButtons = getAllByText('library.edit');
    expect(editButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('tapping Edit on a recipe loads it into context and navigates to CreateTab', async () => {
    const { getAllByText } = await renderAndFlush();
    const editButtons = getAllByText('library.edit');
    expect(editButtons.length).toBeGreaterThanOrEqual(1);

    // Press first available edit button
    fireEvent.press(editButtons[0]);

    await waitFor(() => {
      expect(mockGetRecipeById).toHaveBeenCalled();
      expect(mockUpdateDraft).toHaveBeenCalled();
    });

    const parentNavCall = mockGetParent.mock.results[0]?.value;
    expect(parentNavCall.navigate).toHaveBeenCalledWith('CreateTab');
  });

  it('tapping the draft card loads it into context and navigates to CreateTab', async () => {
    const { getByText } = await renderAndFlush();

    // Press the draft card by title
    fireEvent.press(getByText('Draft Recipe'));

    await waitFor(() => {
      expect(mockGetRecipeById).toHaveBeenCalledWith(draftRecipe.id);
      expect(mockUpdateDraft).toHaveBeenCalled();
    });
  });

  it('shows error message when edit fetch fails', async () => {
    mockGetRecipeById.mockRejectedValue(new Error('network error'));

    const { getAllByText, findByText } = await renderAndFlush();
    const editButtons = getAllByText('library.edit');

    fireEvent.press(editButtons[0]);

    const errorMsg = await findByText('library.editError');
    expect(errorMsg).toBeTruthy();
  });

  it('tapping a published recipe card (not the edit button) navigates to RecipeDetail', async () => {
    const { getAllByText } = await renderAndFlush();

    fireEvent.press(getAllByText('Published Recipe')[0]);

    expect(mockNavigate).toHaveBeenCalledWith('RecipeDetail', {
      recipeId: publishedRecipe.id,
    });
  });
});
