import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/i18n'
import { RecipeCard } from '@/components/UiComponents/RecipeCard'
import type { RecipeSummary } from '@/services/discovery-service'

function makeRecipe(overrides: Partial<RecipeSummary> = {}): RecipeSummary {
  return {
    id: '1',
    title: 'Test Recipe',
    recipeType: 'community',
    averageRating: 4.2,
    ratingCount: 5,
    author: { username: 'tester' },
    ...overrides,
  }
}

function renderCard(recipe: RecipeSummary) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        {/* badge is only rendered in the hero variant */}
        <RecipeCard recipe={recipe} variant="hero" />
      </I18nextProvider>
    </MemoryRouter>,
  )
}

describe('RecipeCard type badge i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('renders English label for a community recipe when locale is en', () => {
    renderCard(makeRecipe({ recipeType: 'community' }))
    expect(screen.getByText('Community')).toBeInTheDocument()
    expect(screen.queryByText('Topluluk')).not.toBeInTheDocument()
  })

  it('renders English label for a cultural recipe when locale is en', () => {
    renderCard(makeRecipe({ recipeType: 'cultural' }))
    expect(screen.getByText('Cultural')).toBeInTheDocument()
    expect(screen.queryByText('Kültürel')).not.toBeInTheDocument()
  })

  it('renders Turkish label for a community recipe when locale is tr', async () => {
    await i18n.changeLanguage('tr')
    renderCard(makeRecipe({ recipeType: 'community' }))
    expect(screen.getByText('Topluluk')).toBeInTheDocument()
    expect(screen.queryByText('Community')).not.toBeInTheDocument()
  })

  it('renders Turkish label for a cultural recipe when locale is tr', async () => {
    await i18n.changeLanguage('tr')
    renderCard(makeRecipe({ recipeType: 'cultural' }))
    expect(screen.getByText('Kültürel')).toBeInTheDocument()
    expect(screen.queryByText('Cultural')).not.toBeInTheDocument()
  })
})
