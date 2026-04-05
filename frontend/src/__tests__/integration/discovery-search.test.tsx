import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'

const DEBOUNCE_MS = 300

describe('Discovery search & text filtering', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('filters genres by name after debounce', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    // Wait for genres to load
    await screen.findByRole('button', { name: 'Soups' })

    // Type in search input
    const searchInput = screen.getByPlaceholderText(/try dessert/i)
    await user.type(searchInput, 'Soup')

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50)

    // Only "Soups" genre should be visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Soups' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Desserts' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Pastries' })).not.toBeInTheDocument()
    })

    // "Matching Genres" heading should appear
    expect(screen.getByText('Matching Genres')).toBeInTheDocument()
  })

  it('filters varieties by name', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    await screen.findByRole('button', { name: 'Soups' })

    const searchInput = screen.getByPlaceholderText(/try dessert/i)
    await user.type(searchInput, 'Baklava')

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50)

    // Variety "Baklava" should appear in search results
    await waitFor(() => {
      expect(screen.getByText('Baklava')).toBeInTheDocument()
    })

    // "Matching Varieties" heading
    expect(screen.getByText('Matching Varieties')).toBeInTheDocument()
  })

  it('filters varieties by region', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    await screen.findByRole('button', { name: 'Soups' })

    const searchInput = screen.getByPlaceholderText(/try dessert/i)
    await user.type(searchInput, 'Lebanon')

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50)

    // Varieties with region "Lebanon" should appear
    await waitFor(() => {
      expect(screen.getByText('Hummus')).toBeInTheDocument()
      expect(screen.getByText('Tabbouleh')).toBeInTheDocument()
    })

    // Turkish varieties should not match
    expect(screen.queryByText('Lentil Soup')).not.toBeInTheDocument()
  })

  it('filters varieties by genre name', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    await screen.findByRole('button', { name: 'Soups' })

    const searchInput = screen.getByPlaceholderText(/try dessert/i)
    await user.type(searchInput, 'Desserts')

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50)

    // "Baklava" variety has genre "Desserts" — should appear
    await waitFor(() => {
      expect(screen.getByText('Baklava')).toBeInTheDocument()
    })
  })

  it('clears search when X button is clicked', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    await screen.findByRole('button', { name: 'Soups' })

    const searchInput = screen.getByPlaceholderText(/try dessert/i)
    await user.type(searchInput, 'Soup')
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50)

    // Only Soups genre visible after search
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Desserts' })).not.toBeInTheDocument()
    })

    // Click clear button
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearBtn)

    // All genres should be back
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Soups' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Desserts' })).toBeInTheDocument()
    })
  })

  it('shows empty state when nothing matches', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    await screen.findByRole('button', { name: 'Soups' })

    const searchInput = screen.getByPlaceholderText(/try dessert/i)
    await user.type(searchInput, 'zzzznotfound')

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50)

    await waitFor(() => {
      expect(
        screen.getAllByText('No genres or dish varieties match your search.').length,
      ).toBeGreaterThanOrEqual(1)
    })
  })
})
