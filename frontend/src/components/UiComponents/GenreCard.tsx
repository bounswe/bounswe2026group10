import type { Genre } from '@/services/discovery-service'
import './GenreCard.css'

interface GenreCardProps {
  genre: Genre
  count?: number
  onClick?: () => void
}

export function GenreCard({ genre, count, onClick }: GenreCardProps) {
  return (
    <button type="button" className="genre-card" onClick={onClick} aria-label={genre.name}>
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
