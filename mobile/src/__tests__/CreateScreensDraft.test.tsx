import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CreateBasicInfoScreen } from '../components/create-basic/CreateBasicInfoScreen';
import { CreateIngredientsToolsScreen } from '../components/create-ingredients/CreateIngredientsToolsScreen';
import { CreateStepsScreen } from '../components/create-steps/CreateStepsScreen';
import { CreateReviewScreen } from '../components/create-review/CreateReviewScreen';
import * as RecipeFormContext from '../context/RecipeFormContext';

// --- Mocks ---

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
  FontAwesome: 'FontAwesome',
}));

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      getParent: jest.fn(() => ({ navigate: jest.fn() })),
    }),
    useIsFocused: () => true,
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

// Mock APIs for BasicInfo
jest.mock('../api/dish-genres', () => ({
  getDishGenres: jest.fn().mockResolvedValue([]),
}));
jest.mock('../api/dietary-tags', () => ({
  getDietaryTags: jest.fn().mockResolvedValue([]),
}));
jest.mock('../api/cultural-tags', () => ({
  getCulturalTags: jest.fn().mockResolvedValue([]),
  pickCulturalTagLabel: jest.fn(),
}));
jest.mock('../api/images', () => ({
  uploadImage: jest.fn(),
}));

// Mock APIs for Ingredients/Tools
jest.mock('../api/ingredients', () => ({
  searchIngredients: jest.fn().mockResolvedValue([]),
}));
jest.mock('../api/tools', () => ({
  getTools: jest.fn().mockResolvedValue([]),
}));
jest.mock('../api/units', () => ({
  getUnits: jest.fn().mockResolvedValue([]),
}));

// Mock API for recipes
jest.mock('../api/recipes', () => ({
  createRecipe: jest.fn().mockResolvedValue({ id: 'new-id' }),
  publishRecipe: jest.fn().mockResolvedValue({ id: 'new-id', isPublished: true }),
  attachRecipeMedia: jest.fn().mockResolvedValue({}),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { role: 'expert' } },
  }),
}));

// Spy on Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Auto-press the OK button for alerts
  if (buttons && buttons.length > 0) {
    const okBtn = buttons.find(b => b.text === 'OK' || !b.style);
    if (okBtn && okBtn.onPress) okBtn.onPress();
  }
});

// --- Tests ---

describe('Save Draft from Create Screens', () => {
  let saveDraftMock: jest.Mock;
  let resetDraftMock: jest.Mock;
  let updateDraftMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    saveDraftMock = jest.fn().mockResolvedValue(true);
    resetDraftMock = jest.fn();
    updateDraftMock = jest.fn();

    // Mock useRecipeForm hook
    jest.spyOn(RecipeFormContext, 'useRecipeForm').mockReturnValue({
      draft: {
        recipeId: null,
        title: '',
        type: 'COMMUNITY',
        originCountry: '',
        originCity: '',
        originDistrict: '',
        genreId: null,
        varietyId: null,
        dietaryTagIds: [],
        dietaryTagNames: [],
        allergenTagIds: [],
        allergenTagNames: [],
        culturalTagIds: [],
        culturalTags: [],
        story: '',
        imageUrls: [],
        ingredients: [],
        tools: [],
        steps: [],
        videoUrl: null,
        videoFileName: null,
      },
      updateDraft: updateDraftMock,
      resetDraft: resetDraftMock,
      saveDraft: saveDraftMock,
    } as any);
  });

  it('CreateBasicInfoScreen should save draft with basic info', async () => {
    const { getByText } = render(<CreateBasicInfoScreen />);

    // Wait for the button to appear
    await waitFor(() => {
      expect(getByText('create.saveDraft')).toBeTruthy();
    });

    const saveDraftBtn = getByText('create.saveDraft');
    fireEvent.press(saveDraftBtn);

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledTimes(1);
      // It should pass partial state to saveDraft
      expect(saveDraftMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '',
          type: 'COMMUNITY',
          originCountry: '',
        })
      );
    });
  });

  it('CreateIngredientsToolsScreen should save draft with ingredients and tools', async () => {
    const { getByText } = render(<CreateIngredientsToolsScreen />);

    await waitFor(() => {
      expect(getByText('create.saveDraft')).toBeTruthy();
    });

    const saveDraftBtn = getByText('create.saveDraft');
    fireEvent.press(saveDraftBtn);

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledTimes(1);
      // Expected to save ingredients and tools arrays
      expect(saveDraftMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: expect.any(Array),
          tools: expect.any(Array),
        })
      );
    });
  });

  it('CreateStepsScreen should save draft with steps', async () => {
    const { getByText } = render(<CreateStepsScreen />);

    await waitFor(() => {
      expect(getByText('create.saveDraft')).toBeTruthy();
    });

    const saveDraftBtn = getByText('create.saveDraft');
    fireEvent.press(saveDraftBtn);

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledTimes(1);
      // Expected to save steps array and video data
      expect(saveDraftMock).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.any(Array),
          videoUrl: null,
          videoFileName: null,
        })
      );
    });
  });

  it('CreateReviewScreen should save draft with empty object to trigger backend update', async () => {
    const { getByText } = render(<CreateReviewScreen />);

    // In Review screen, the button text might be different based on translation mock
    // "create.review.saveDraft" is used in Review Screen
    await waitFor(() => {
      expect(getByText('create.review.saveDraft')).toBeTruthy();
    });

    const saveDraftBtn = getByText('create.review.saveDraft');
    fireEvent.press(saveDraftBtn);

    await waitFor(() => {
      expect(saveDraftMock).toHaveBeenCalledTimes(1);
      // Review screen simply triggers saveDraft({})
      expect(saveDraftMock).toHaveBeenCalledWith({});
    });
  });
});
