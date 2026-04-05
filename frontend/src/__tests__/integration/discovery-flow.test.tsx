import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'

describe('Discovery flow: genre → variety → recipe', () => {
  it('navigates from genre selection through variety to recipe detail', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    // ── Wait for genres to load ───────────────────────────────────────────
    const soupsCard = await screen.findByRole('button', { name: 'Soups' })
    expect(soupsCard).toBeInTheDocument()

    // All 8 genres on page 1 should be visible (out of 10 total)
    expect(screen.getByRole('button', { name: 'Soups' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desserts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pastries' })).toBeInTheDocument()

    // ── Select "Soups" genre ──────────────────────────────────────────────
    await user.click(soupsCard)

    // Varieties filtered to Soups genre should appear
    const lentilVariety = await screen.findByText('Lentil Soup')
    expect(lentilVariety).toBeInTheDocument()
    expect(screen.getByText('Tomato Soup')).toBeInTheDocument()

    // Varieties from other genres should not be present
    expect(screen.queryByText('Baklava')).not.toBeInTheDocument()
    expect(screen.queryByText('Hummus')).not.toBeInTheDocument()

    // ── Click "Lentil Soup" variety to navigate to detail ─────────────────
    const lentilButton = lentilVariety.closest('button')!
    await user.click(lentilButton)

    // ── DishVarietyPage: verify variety detail loaded ─────────────────────
    const varietyHeading = await screen.findByRole('heading', { name: 'Lentil Soup' })
    expect(varietyHeading).toBeInTheDocument()

    // Genre badge
    expect(screen.getByText('Soups')).toBeInTheDocument()

    // Description
    expect(screen.getByText('A hearty Turkish soup made with red lentils')).toBeInTheDocument()

    // Recipe rows should appear
    const grandmaRecipe = await screen.findByText("Grandma's Lentil Soup")
    expect(grandmaRecipe).toBeInTheDocument()
    expect(screen.getByText('Quick Red Lentil Soup')).toBeInTheDocument()

    // Cultural badge on first recipe
    expect(screen.getByText('Cultural')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()

    // Rating shown
    expect(screen.getByText('4.5')).toBeInTheDocument()

    // ── Click recipe to navigate to detail ────────────────────────────────
    const recipeRow = grandmaRecipe.closest('button')!
    await user.click(recipeRow)

    // ── RecipeDetailPage: verify recipe detail loaded ─────────────────────
    const recipeTitle = await screen.findByRole('heading', { name: "Grandma's Lentil Soup" })
    expect(recipeTitle).toBeInTheDocument()

    // Story
    expect(screen.getByText('Passed down for three generations in our family.')).toBeInTheDocument()

    // Ingredients
    expect(screen.getByText('Red Lentils')).toBeInTheDocument()
    expect(screen.getByText('Onion')).toBeInTheDocument()
    expect(screen.getByText('Butter')).toBeInTheDocument()

    // Allergen warning on Butter
    expect(screen.getByText(/Dairy/)).toBeInTheDocument()

    // Steps
    expect(screen.getByText('Wash and drain the lentils.')).toBeInTheDocument()
    expect(screen.getByText('Saute onion in butter until translucent.')).toBeInTheDocument()

    // Tools
    expect(screen.getByText('Large pot')).toBeInTheDocument()
  })

  it('paginates genres when more than 8 exist', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    // Wait for first page of genres
    await screen.findByRole('button', { name: 'Soups' })

    // Page 1: first 8 genres visible
    expect(screen.getByRole('button', { name: 'Soups' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pastries' })).toBeInTheDocument()

    // Genres 9-10 should NOT be on page 1
    expect(screen.queryByRole('button', { name: 'Grills' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Stews' })).not.toBeInTheDocument()

    // Click "Next" pagination button
    const nextBtn = screen.getByRole('button', { name: /next/i })
    await user.click(nextBtn)

    // Page 2: genres 9-10 visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Grills' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Stews' })).toBeInTheDocument()
    })

    // Page 1 genres should be gone
    expect(screen.queryByRole('button', { name: 'Soups' })).not.toBeInTheDocument()

    // Click "Previous" to go back
    const prevBtn = screen.getByRole('button', { name: /previous/i })
    await user.click(prevBtn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Soups' })).toBeInTheDocument()
    })
  })

  it('clears genre selection when "Clear all filters" is clicked', async () => {
    const { user } = renderWithProviders(undefined, {
      initialEntries: ['/discovery'],
    })

    // Wait for genres and select one
    const soupsCard = await screen.findByRole('button', { name: 'Soups' })
    await user.click(soupsCard)

    // Varieties for Soups should be visible
    await screen.findByText('Lentil Soup')

    // "Clear all filters" button should appear
    const clearBtn = screen.getByRole('button', { name: /clear all filters/i })
    await user.click(clearBtn)

    // After clearing, the prompt text should reappear (it shows in multiple sections)
    await waitFor(() => {
      const promptTexts = screen.getAllByText('Select a genre to list dish varieties.')
      expect(promptTexts.length).toBeGreaterThanOrEqual(1)
    })
  })
})
