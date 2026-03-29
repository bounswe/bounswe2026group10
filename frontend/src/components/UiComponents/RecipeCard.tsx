import type { RecipeSummary } from '@/services/discovery-service'
import './RecipeCard.css'

interface RecipeCardProps {
  recipe: RecipeSummary
  variant?: 'hero' | 'horizontal'
  onClick?: () => void
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function RecipeCard({ recipe, variant = 'horizontal', onClick }: RecipeCardProps) {
  const rating = recipe.averageRating ?? 0
  const typeBadge = recipe.recipeType === 'cultural' ? 'Cultural' : 'Community'

  if (variant === 'hero') {
    return (
      <button type="button" className="recipe-card recipe-card--hero" onClick={onClick}>
        <div className="recipe-card__hero-img">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
          ) : (
            <div className="recipe-card__img-placeholder" />
          )}
          <span className={`recipe-card__badge recipe-card__badge--${recipe.recipeType}`}>
            {typeBadge}
          </span>
        </div>
        <div className="recipe-card__body">
          <h3 className="recipe-card__title">{recipe.title}</h3>
          <p className="recipe-card__author">{recipe.author.username}</p>
          <div className="recipe-card__meta">
            {rating > 0 && (
              <span className="recipe-card__rating">
                <StarIcon />
                {rating.toFixed(1)}
              </span>
            )}
            {recipe.region && (
              <span className="recipe-card__region">{recipe.region}</span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <button type="button" className="recipe-card recipe-card--horizontal" onClick={onClick}>
      <div className="recipe-card__thumb">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
        ) : (
          <div className="recipe-card__img-placeholder" />
        )}
      </div>
      <div className="recipe-card__body">
        <h3 className="recipe-card__title">{recipe.title}</h3>
        <p className="recipe-card__author">{recipe.author.username}</p>
        <div className="recipe-card__meta">
          {rating > 0 && (
            <span className="recipe-card__rating">
              <StarIcon />
              {rating.toFixed(1)}
            </span>
          )}
          {recipe.region && (
            <span className="recipe-card__region">{recipe.region}</span>
          )}
        </div>
      </div>
    </button>
  )
}
