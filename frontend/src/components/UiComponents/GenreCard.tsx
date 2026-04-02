import type { Genre } from '@/services/discovery-service'
import './GenreCard.css'

interface GenreCardProps {
  genre: Genre
  count?: number
  isActive?: boolean
  onClick?: () => void
}

export function GenreCard({ genre, count, isActive, onClick }: GenreCardProps) {
  return (
    <button
      type="button"
      className={`genre-card${isActive ? ' genre-card--active' : ''}`}
      onClick={onClick}
      aria-label={genre.name}
      aria-pressed={isActive ?? false}
    >
      <div className="genre-card__img">
        {genre.imageUrl ? (
          <img src={genre.imageUrl} alt={genre.name} loading="lazy" />
        ) : (
          <div className="genre-card__img-placeholder" />
        )}
        <div className="genre-card__overlay" />
      </div>
      <div className="genre-card__label">
        <span className="genre-card__name">{genre.name}</span>
        {count !== undefined && (
          <span className="genre-card__count">{count} recipes</span>
        )}
      </div>
    </button>
  )
}
