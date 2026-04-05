import React, { ComponentProps } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { FilterModal } from '../components/search/FilterModal';
import { fetchDietaryTags } from '../api/search';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../api/search', () => ({
  fetchRegions: jest.fn(),
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

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('shows "Filters" heading', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Filters')).toBeTruthy();
    });

    it('shows Country section header', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Country')).toBeTruthy();
    });

    it('shows Region section header (always visible, disabled without country)', async () => {
      const { getByText } = await renderAndFlush();
      // Region header text contains the disabled hint
      expect(getByText(/Region/)).toBeTruthy();
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

  // ─── Section expand/collapse ──────────────────────────────────────────────

  describe('expand / collapse', () => {
    it('country list is hidden until Country header is pressed', async () => {
      const { getByText, queryByText } = await renderAndFlush();
      // Countries are not shown until section is expanded
      expect(queryByText('Turkey')).toBeNull();
      fireEvent.press(getByText('Country'));
      expect(getByText('Turkey')).toBeTruthy();
      expect(getByText('Greece')).toBeTruthy();
    });

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

  // ─── Country → Region dependency ─────────────────────────────────────────

  describe('country → region behaviour', () => {
    it('region section shows disabled hint when no country selected', async () => {
      const { getByText } = await renderAndFlush();
      // The region title includes the hint text when disabled
      expect(getByText(/select a country first/)).toBeTruthy();
    });

    it('region section becomes active after selecting a country', async () => {
      const { getByText } = await renderAndFlush();
      // Expand country, pick Turkey
      fireEvent.press(getByText('Country'));
      fireEvent.press(getByText('Turkey'));
      // Region header no longer shows disabled hint
      await waitFor(() => {
        expect(() => getByText(/select a country first/)).toThrow();
      });
    });

    it('clearing country clears region selection immediately', async () => {
      const onApply = jest.fn();
      const { getByText } = await renderAndFlush({ ...defaultProps, onApply });

      // Select Turkey and a region
      fireEvent.press(getByText('Country'));
      fireEvent.press(getByText('Turkey'));
      fireEvent.press(getByText(/Region/));
      fireEvent.press(getByText('Istanbul'));

      // Now deselect Turkey
      fireEvent.press(getByText('Turkey'));

      // Apply and verify region is cleared
      fireEvent.press(getByText('Apply Filters'));
      expect(onApply).toHaveBeenCalledWith(
        expect.objectContaining({ country: undefined, region: undefined })
      );
    });
  });

  // ─── Callbacks ────────────────────────────────────────────────────────────

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

  // ─── appliedFilters sync ──────────────────────────────────────────────────

  describe('appliedFilters sync', () => {
    it('resets internal state when appliedFilters changes to empty', async () => {
      const onApply = jest.fn();
      const filledFilters = {
        country: 'Turkey',
        region: 'Istanbul',
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
      expect(lastCall.country).toBeUndefined();
      expect(lastCall.region).toBeUndefined();
      expect(lastCall.excludeAllergenIds).toEqual([]);
      expect(lastCall.dietaryTagIds).toEqual([]);
    });
  });
});
