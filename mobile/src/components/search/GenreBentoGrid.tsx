import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DishGenre } from '../../api/dish-genres';
import { colors, fonts, fontSizes, spacing } from '../../theme';

const GENRE_IMAGES: Record<string, string> = {
  soups: 'https://picsum.photos/seed/genre-soups/400/300',
  desserts: 'https://picsum.photos/seed/genre-desserts/400/300',
  pastries: 'https://picsum.photos/seed/genre-pastries/400/300',
  salads: 'https://picsum.photos/seed/genre-salads/400/300',
  stews: 'https://picsum.photos/seed/genre-stews/400/300',
  mezzes: 'https://picsum.photos/seed/genre-mezzes/400/300',
  kebabs: 'https://picsum.photos/seed/genre-kebabs/400/300',
};

function getGenreImage(name: string): string {
  const key = name.toLowerCase();
  return GENRE_IMAGES[key] ?? `https://picsum.photos/seed/genre-${key}/400/300`;
}

interface GenreBentoGridProps {
  genres: DishGenre[];
  onGenrePress: (genre: DishGenre) => void;
  activeGenreId?: number | null;
}

interface GenreTileProps {
  genre: DishGenre;
  onPress: () => void;
  tall?: boolean;
  active?: boolean;
}

function GenreTile({ genre, onPress, tall = false, active = false }: GenreTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.tile, tall && styles.tileTall, active && styles.tileActive]}
    >
      <ImageBackground
        source={{ uri: getGenreImage(genre.name) }}
        style={styles.tileImage}
        imageStyle={styles.tileImageInner}
      >
        <View style={[styles.tileOverlay, active && styles.tileOverlayActive]} />
        <View style={styles.tileLabel}>
          <Text style={styles.tileName}>{genre.name}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export function GenreBentoGrid({ genres, onGenrePress, activeGenreId }: GenreBentoGridProps) {
  if (genres.length === 0) return null;

  // First genre is large (spans full row), rest fill 2-column grid
  const [first, ...rest] = genres;

  return (
    <View style={styles.container}>
      {first && (
        <GenreTile genre={first} onPress={() => onGenrePress(first)} tall active={activeGenreId === first.id} />
      )}
      <View style={styles.grid}>
        {rest.map((genre) => (
          <GenreTile key={genre.id} genre={genre} onPress={() => onGenrePress(genre)} active={activeGenreId === genre.id} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tileTall: {
    height: 180,
  },
  tileImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tileImageInner: {
    borderRadius: 20,
  },
  tileActive: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
  },
  tileOverlayActive: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tileLabel: {
    padding: spacing.md,
  },
  tileName: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
