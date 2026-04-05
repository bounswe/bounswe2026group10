import React, { ComponentProps } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { FilterModal } from '../components/search/FilterModal';
import { fetchDietaryTags } from '../api/search';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../api/search', () => ({
  fetchDietaryTags: jest.fn(),
}));

const mockFetchTags = fetchDietaryTags as jest.MockedFunction<typeof fetchDietaryTags>;

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
      { id: 2, name: 'Peanuts', category: 'allergen' },
    ]);
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

  describe('appliedFilters sync', () => {
    it('resets internal state when appliedFilters changes to empty', async () => {
      const onApply = jest.fn();
      const filledFilters = {
        excludeAllergenIds: [2],
        excludeAllergenNames: ['Peanuts'],
        dietaryTagIds: [1],
        dietaryTagNames: ['Vegetarian'],
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
