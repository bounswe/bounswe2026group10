import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/render-with-providers'

interface MetaOverrides {
  country?: string | null
  city?: string | null
  district?: string | null
  dishVarietyName?: string | null
  genreName?: string | null
}

function mockRecipeWithMeta(overrides: MetaOverrides = {}) {
  server.use(
    http.get('/api/recipes/:id', () =>
      HttpResponse.json({
        success: true,
        data: {
          id: 101,
          title: 'Recipe Under Test',
          story: null,
          videoUrl: null,
          servingSize: 2,
          type: 'community',
          isPublished: true,
          averageRating: null,
          ratingCount: 0,
          creatorId: '1',
          creatorUsername: 'tester',
          dishVarietyId: null,
          dishVarietyName: overrides.dishVarietyName ?? null,
          genreName: overrides.genreName ?? null,
          country: overrides.country ?? null,
          city: overrides.city ?? null,
          district: overrides.district ?? null,
          ingredients: [],
          steps: [],
          tools: [],
          media: [],
          tags: [],
          culturalTags: [],
          videoAnnotations: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
        error: null,
      }),
    ),
    http.get('/api/recipes/:id/ratings/me', () =>
      HttpResponse.json({ success: true, data: null, error: null }),
    ),
  )
}

async function renderRecipeDetail() {
  const result = renderWithProviders(undefined, { initialEntries: ['/recipes/101'] })
  // Wait for the recipe title to appear — confirms the page resolved.
  await waitFor(() => {
    expect(result.getByText('Recipe Under Test')).toBeInTheDocument()
  })
  return result
}

describe('RecipeDetailPage meta lines', () => {
  it('renders both taxonomy line and location line when all four fields are present', async () => {
    mockRecipeWithMeta({
      genreName: 'Soups',
      dishVarietyName: 'Lentil Soup',
      city: 'Istanbul',
      country: 'Turkey',
    })

    const { getByText } = await renderRecipeDetail()
    expect(getByText('Soups · Lentil Soup')).toBeInTheDocument()
    expect(getByText('Istanbul, Turkey')).toBeInTheDocument()
  })

  it('renders only the country when city is missing', async () => {
    mockRecipeWithMeta({
      genreName: 'Soups',
      dishVarietyName: 'Lentil Soup',
      country: 'Japan',
      city: null,
    })

    const { getByText, queryByText } = await renderRecipeDetail()
    expect(getByText('Japan')).toBeInTheDocument()
    // Comma separator only shown when both city and country exist
    expect(queryByText(/,/)).not.toBeInTheDocument()
  })

  it('renders only the genre when variety is missing', async () => {
    mockRecipeWithMeta({
      genreName: 'Soups',
      dishVarietyName: null,
      country: 'Turkey',
    })

    const { getByText, queryByText } = await renderRecipeDetail()
    expect(getByText('Soups')).toBeInTheDocument()
    expect(queryByText(/·/)).not.toBeInTheDocument()
  })

  it('omits the location line entirely when both city and country are null', async () => {
    mockRecipeWithMeta({
      genreName: 'Soups',
      dishVarietyName: 'Lentil Soup',
      country: null,
      city: null,
    })

    const { getByText, queryByText } = await renderRecipeDetail()
    expect(getByText('Soups · Lentil Soup')).toBeInTheDocument()
    // No location line — no country word visible
    expect(queryByText('Turkey')).not.toBeInTheDocument()
    expect(queryByText('Istanbul')).not.toBeInTheDocument()
  })
})
