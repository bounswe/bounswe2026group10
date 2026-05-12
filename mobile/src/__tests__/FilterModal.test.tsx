import React, { ComponentProps } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { FilterModal } from '../components/search/FilterModal';
import { fetchDietaryTags, fetchLocations } from '../api/search';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../api/search', () => ({
  fetchDietaryTags: jest.fn(),
  fetchLocations: jest.fn(),
}));

jest.mock('../api/allergens', () => ({
  getAllergens: jest.fn(),
}));

jest.mock('../api/cultural-tags', () => {
  const actual = jest.requireActual('../api/cultural-tags');
  return {
    ...actual,
    getCulturalTags: jest.fn(),
  };
});

const { getCulturalTags } = jest.requireMock('../api/cultural-tags') as {
  getCulturalTags: jest.Mock;
};
const { getAllergens } = jest.requireMock('../api/allergens') as {
  getAllergens: jest.Mock;
};

const mockFetchTags = fetchDietaryTags as jest.MockedFunction<typeof fetchDietaryTags>;
const mockFetchLocations = fetchLocations as jest.MockedFunction<typeof fetchLocations>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onApply: jest.fn(),
  onClear: jest.fn(),
};

async function renderAndFlush(props: ComponentProps<typeof FilterModal> = defaultProps) {
  const result = render(<FilterModal {...props} />);
  await act(async () => { await Promise.resolve(); });
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FilterModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTags.mockResolvedValue([
      { id: 1, name: 'Vegetarian', category: 'dietary' },
    ]);
    mockFetchLocations.mockResolvedValue(['Turkey', 'Italy']);
    getAllergens.mockResolvedValue([{ id: 2, name: 'Peanuts' }]);
    getCulturalTags.mockImplementation(async (country?: string | null) => {
      const all = [
        { id: 1, key: 'wedding', labelEn: 'Wedding', labelTr: 'Düğün', country: null },
        { id: 9, key: 'iftar', labelEn: 'Iftar', labelTr: 'İftar', country: 'Turkey' },
        { id: 10, key: 'mochitsuki', labelEn: 'Mochitsuki', labelTr: 'Mochitsuki', country: 'Japan' },
      ];
      if (!country) return all;
      const c = country.toLowerCase();
      return all.filter((t) => t.country === null || t.country.toLowerCase() === c);
    });
  });

  describe('rendering', () => {
    it('shows "Filters" heading', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Filters')).toBeTruthy();
    });

    it('shows Exclude Allergens section after tags load', async () => {
      const { getByText } = await renderAndFlush();
      await waitFor(() => {
        expect(getByText('Exclude Allergens')).toBeTruthy();
      });
    });

    it('shows Dietary Preferences section after tags load', async () => {
      const { getByText } = await renderAndFlush();
      await waitFor(() => {
        expect(getByText('Dietary Preferences')).toBeTruthy();
      });
    });

    it('renders Apply Filters and Clear All buttons', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Apply Filters')).toBeTruthy();
      expect(getByText('Clear All')).toBeTruthy();
    });
  });

  describe('expand / collapse', () => {
    it('allergen items hidden until section expanded', async () => {
      const { getByText, queryByText } = await renderAndFlush();
      await waitFor(() => expect(getByText('Exclude Allergens')).toBeTruthy());
      expect(queryByText('Peanuts')).toBeNull();
      fireEvent.press(getByText('Exclude Allergens'));
      expect(getByText('Peanuts')).toBeTruthy();
    });

    it('dietary items hidden until section expanded', async () => {
      const { getByText, queryByText } = await renderAndFlush();
      await waitFor(() => expect(getByText('Dietary Preferences')).toBeTruthy());
      expect(queryByText('Vegetarian')).toBeNull();
      fireEvent.press(getByText('Dietary Preferences'));
      expect(getByText('Vegetarian')).toBeTruthy();
    });
  });

  describe('callbacks', () => {
    it('calls onApply with current filters when Apply Filters pressed', async () => {
      const onApply = jest.fn();
      const { getByText } = await renderAndFlush({ ...defaultProps, onApply });
      fireEvent.press(getByText('Apply Filters'));
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeAllergenIds: [],
          dietaryTagIds: [],
        })
      );
    });

    it('calls onClear when Clear All is pressed', async () => {
      const onClear = jest.fn();
      const { getByText } = await renderAndFlush({ ...defaultProps, onClear });
      fireEvent.press(getByText('Clear All'));
      expect(onClear).toHaveBeenCalled();
    });

    it('calls onClose when close icon is pressed', async () => {
      const onClose = jest.fn();
      const { UNSAFE_getAllByType } = await renderAndFlush({ ...defaultProps, onClose });
      const icons = UNSAFE_getAllByType('MaterialCommunityIcons' as any);
      fireEvent.press(icons[0].parent!);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('cultural tags', () => {
    it('renders the Cultural Tags section after the mock loads', async () => {
      const { getByText } = await renderAndFlush();
      await waitFor(() => expect(getByText('Cultural Tags')).toBeTruthy());
    });

    it('hides cultural tag items until the section is expanded', async () => {
      const { getByText, queryByText } = await renderAndFlush();
      await waitFor(() => expect(getByText('Cultural Tags')).toBeTruthy());
      expect(queryByText('Wedding')).toBeNull();
      fireEvent.press(getByText('Cultural Tags'));
      expect(getByText('Wedding')).toBeTruthy();
    });

    it('refetches cultural tags scoped to the selected country', async () => {
      const { getByText, queryByText } = await renderAndFlush({
        ...defaultProps,
        appliedFilters: {
          excludeAllergenIds: [],
          excludeAllergenNames: [],
          dietaryTagIds: [],
          dietaryTagNames: [],
          culturalTagIds: [],
          culturalTagNames: [],
          country: 'Japan',
          city: '',
        },
      });
      await waitFor(() => expect(getByText('Cultural Tags')).toBeTruthy());
      fireEvent.press(getByText('Cultural Tags'));
      // Japan was passed to getCulturalTags → only global + Japan-scoped tags are eligible
      await waitFor(() => expect(getByText('Mochitsuki')).toBeTruthy());
      expect(queryByText('Iftar')).toBeNull();
    });

    it('forwards selected cultural tags via onApply', async () => {
      const onApply = jest.fn();
      const { getByText } = await renderAndFlush({ ...defaultProps, onApply });
      await waitFor(() => expect(getByText('Cultural Tags')).toBeTruthy());
      fireEvent.press(getByText('Cultural Tags'));
      fireEvent.press(getByText('Wedding'));
      fireEvent.press(getByText('Apply Filters'));
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          culturalTagIds: [1],
          culturalTagNames: ['Wedding'],
        }),
      );
    });

    it('toggling a cultural tag twice deselects it', async () => {
      const onApply = jest.fn();
      const { getByText } = await renderAndFlush({ ...defaultProps, onApply });
      await waitFor(() => expect(getByText('Cultural Tags')).toBeTruthy());
      fireEvent.press(getByText('Cultural Tags'));
      fireEvent.press(getByText('Wedding'));
      fireEvent.press(getByText('Wedding'));
      fireEvent.press(getByText('Apply Filters'));
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({
          culturalTagIds: [],
          culturalTagNames: [],
        }),
      );
    });
  });

  describe('appliedFilters sync', () => {
    it('resets internal state when appliedFilters changes to empty', async () => {
      const onApply = jest.fn();
      const filledFilters = {
        excludeAllergenIds: [2],
        excludeAllergenNames: ['Peanuts'],
        dietaryTagIds: [1],
        dietaryTagNames: ['Vegetarian'],
        culturalTagIds: [],
        culturalTagNames: [],
        country: 'Turkey',
        city: 'Istanbul',
      };
      const { getByText, rerender } = await renderAndFlush({
        ...defaultProps,
        onApply,
        appliedFilters: filledFilters,
      });

      // Simulate parent clearing filters
      rerender(
        <FilterModal
          {...defaultProps}
          onApply={onApply}
          appliedFilters={{
            excludeAllergenIds: [],
            excludeAllergenNames: [],
            dietaryTagIds: [],
            dietaryTagNames: [],
            culturalTagIds: [],
            culturalTagNames: [],
            country: '',
            city: '',
          }}
        />
      );

      // Apply should now have cleared state
      fireEvent.press(getByText('Apply Filters'));
      const lastCall = onApply.mock.calls[onApply.mock.calls.length - 1][0];
      expect(lastCall.excludeAllergenIds).toEqual([]);
      expect(lastCall.dietaryTagIds).toEqual([]);
    });
  });
});
