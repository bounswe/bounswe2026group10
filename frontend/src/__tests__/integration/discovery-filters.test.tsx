import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'
import { DiscoveryFilters, type DiscoveryFiltersProps } from '@/components/Discovery/DiscoveryFilters'

const mockRegions = ['Turkey', 'Lebanon', 'Greece']
const mockAllergens = [
  { id: '1', name: 'Dairy' },
  { id: '2', name: 'Nuts' },
  { id: '3', name: 'Gluten' },
]
const mockDietaryTags = [
  { id: '10', name: 'Vegan' },
  { id: '11', name: 'Gluten-Free' },
]

function renderFilters(overrides: Partial<DiscoveryFiltersProps> = {}) {
  const defaultProps: DiscoveryFiltersProps = {
    regions: mockRegions,
    allergens: mockAllergens,
    dietaryTags: mockDietaryTags,
    selectedRegion: null,
    selectedAllergens: [],
    selectedDietaryTags: [],
    onRegionChange: vi.fn(),
    onAllergensChange: vi.fn(),
    onDietaryTagsChange: vi.fn(),
    onApplyFilters: vi.fn(),
    isLoading: false,
    ...overrides,
  }

  const user = userEvent.setup()
  const result = render(
    <I18nextProvider i18n={i18n}>
      <DiscoveryFilters {...defaultProps} />
    </I18nextProvider>,
  )

  return { ...result, user, props: defaultProps }
}

describe('DiscoveryFilters component', () => {
  describe('RegionSelector', () => {
    it('renders all regions as radio buttons with "All regions" default', () => {
      renderFilters()

      const allRegionsRadio = screen.getByRole('radio', { name: 'All regions' })
      expect(allRegionsRadio).toBeChecked()

      expect(screen.getByRole('radio', { name: 'Turkey' })).not.toBeChecked()
      expect(screen.getByRole('radio', { name: 'Lebanon' })).not.toBeChecked()
      expect(screen.getByRole('radio', { name: 'Greece' })).not.toBeChecked()
    })

    it('calls onRegionChange when a region is selected', async () => {
      const onRegionChange = vi.fn()
      const { user } = renderFilters({ onRegionChange })

      await user.click(screen.getByRole('radio', { name: 'Turkey' }))
      expect(onRegionChange).toHaveBeenCalledWith('Turkey')
    })

    it('shows selected region as checked', () => {
      renderFilters({ selectedRegion: 'Lebanon' })
      expect(screen.getByRole('radio', { name: 'Lebanon' })).toBeChecked()
    })
  })

  describe('AllergenFilter', () => {
    it('renders allergens as checkboxes', () => {
      renderFilters()

      expect(screen.getByRole('checkbox', { name: /avoid dairy/i })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: /avoid nuts/i })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: /avoid gluten/i })).not.toBeChecked()
    })

    it('calls onAllergensChange when an allergen is toggled on', async () => {
      const onAllergensChange = vi.fn()
      const { user } = renderFilters({ onAllergensChange })

      await user.click(screen.getByRole('checkbox', { name: /avoid dairy/i }))
      expect(onAllergensChange).toHaveBeenCalledWith(['1'])
    })

    it('calls onAllergensChange to add to existing selections', async () => {
      const onAllergensChange = vi.fn()
      const { user } = renderFilters({
        onAllergensChange,
        selectedAllergens: ['1'],
      })

      // Dairy should be checked
      expect(screen.getByRole('checkbox', { name: /avoid dairy/i })).toBeChecked()

      // Click Nuts to add it
      await user.click(screen.getByRole('checkbox', { name: /avoid nuts/i }))
      expect(onAllergensChange).toHaveBeenCalledWith(['1', '2'])
    })

    it('calls onAllergensChange to remove when toggled off', async () => {
      const onAllergensChange = vi.fn()
      const { user } = renderFilters({
        onAllergensChange,
        selectedAllergens: ['1', '2'],
      })

      // Click Dairy to deselect
      await user.click(screen.getByRole('checkbox', { name: /avoid dairy/i }))
      expect(onAllergensChange).toHaveBeenCalledWith(['2'])
    })

    it('shows clear button when allergens are selected', () => {
      renderFilters({ selectedAllergens: ['1'] })

      // The AllergenFilter has its own "Clear all filters" button
      const clearButtons = screen.getAllByRole('button', { name: /clear/i })
      expect(clearButtons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('DietaryTagsFilter', () => {
    it('renders dietary tags as checkboxes', () => {
      renderFilters()

      expect(screen.getByRole('checkbox', { name: 'Vegan' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Gluten-Free' })).not.toBeChecked()
    })

    it('calls onDietaryTagsChange when a tag is toggled', async () => {
      const onDietaryTagsChange = vi.fn()
      const { user } = renderFilters({ onDietaryTagsChange })

      await user.click(screen.getByRole('checkbox', { name: 'Vegan' }))
      expect(onDietaryTagsChange).toHaveBeenCalledWith(['10'])
    })

    it('calls onDietaryTagsChange to add to existing selections', async () => {
      const onDietaryTagsChange = vi.fn()
      const { user } = renderFilters({
        onDietaryTagsChange,
        selectedDietaryTags: ['10'],
      })

      expect(screen.getByRole('checkbox', { name: 'Vegan' })).toBeChecked()

      await user.click(screen.getByRole('checkbox', { name: 'Gluten-Free' }))
      expect(onDietaryTagsChange).toHaveBeenCalledWith(['10', '11'])
    })
  })

  describe('Clear all filters', () => {
    it('does not show "Clear all filters" header button when no filters active', () => {
      renderFilters()

      // The header-level reset button only appears when hasActiveFilters is true
      const headerButtons = screen.queryAllByRole('button')
      const resetBtn = headerButtons.find(
        (btn) => btn.classList.contains('discovery-filters__reset'),
      )
      expect(resetBtn).toBeUndefined()
    })

    it('shows "Clear all filters" button and resets all when clicked', async () => {
      const onRegionChange = vi.fn()
      const onAllergensChange = vi.fn()
      const onDietaryTagsChange = vi.fn()

      const { user } = renderFilters({
        selectedRegion: 'Turkey',
        selectedAllergens: ['1'],
        selectedDietaryTags: ['10'],
        onRegionChange,
        onAllergensChange,
        onDietaryTagsChange,
      })

      // The "Clear all filters" header button (with class discovery-filters__reset)
      const allClearButtons = screen.getAllByText('Clear all filters')
      const resetBtn = allClearButtons.find(
        (btn) => btn.classList.contains('discovery-filters__reset'),
      )!
      expect(resetBtn).toBeDefined()
      await user.click(resetBtn)

      expect(onRegionChange).toHaveBeenCalledWith(null)
      expect(onAllergensChange).toHaveBeenCalledWith([])
      expect(onDietaryTagsChange).toHaveBeenCalledWith([])
    })
  })

  describe('Apply filters', () => {
    it('calls onApplyFilters when the apply button is clicked', async () => {
      const onApplyFilters = vi.fn()
      const { user } = renderFilters({ onApplyFilters })

      await user.click(screen.getByRole('button', { name: /apply filters/i }))
      expect(onApplyFilters).toHaveBeenCalledTimes(1)
    })

    it('shows loading state when isLoading is true', () => {
      renderFilters({ isLoading: true })

      const applyBtn = screen.getByRole('button', { name: /loading/i })
      expect(applyBtn).toHaveAttribute('aria-busy', 'true')
      expect(applyBtn).toBeDisabled()
    })
  })
})
