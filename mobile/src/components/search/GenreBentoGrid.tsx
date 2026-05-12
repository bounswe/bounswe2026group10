import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DishGenre } from '../../api/dish-genres';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface GenreBentoGridProps {
  genres: DishGenre[];
  onGenrePress: (genre: DishGenre) => void;
  activeGenreId?: number | null;
}

export function GenreBentoGrid({ genres, onGenrePress, activeGenreId }: GenreBentoGridProps) {
  if (genres.length === 0) return null;

  return (
    <View style={styles.container}>
      {genres.map((genre) => {
        const active = activeGenreId === genre.id;
        return (
          <TouchableOpacity
            key={genre.id}
            onPress={() => onGenrePress(genre)}
            activeOpacity={0.7}
            style={[styles.row, active && styles.rowActive]}
          >
            <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
              {genre.name}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={active ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowActive: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.primary,
  },
  name: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    marginRight: spacing.sm,
  },
  nameActive: {
    color: colors.primary,
  },
});
