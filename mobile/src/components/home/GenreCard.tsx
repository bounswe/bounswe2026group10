import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

const GENRE_IMAGES: Record<string, string> = {
  soups: 'https://picsum.photos/seed/genre-soups/300/400',
  mezzes: 'https://picsum.photos/seed/genre-mezzes/300/400',
  pastry: 'https://picsum.photos/seed/genre-pastry/300/400',
  kebabs: 'https://picsum.photos/seed/genre-kebabs/300/400',
  salads: 'https://picsum.photos/seed/genre-salads/300/400',
  desserts: 'https://picsum.photos/seed/genre-desserts/300/400',
  stews: 'https://picsum.photos/seed/genre-stews/300/400',
  pilafs: 'https://picsum.photos/seed/genre-pilafs/300/400',
};

function getGenreImage(name: string): string {
  const key = name.toLowerCase();
  return GENRE_IMAGES[key] ?? `https://picsum.photos/seed/genre-${key}/300/400`;
}

interface GenreCardProps {
  id: number;
  name: string;
  onPress?: () => void;
}

export function GenreCard({ name, onPress }: GenreCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <ImageBackground
        source={{ uri: getGenreImage(name) }}
        style={styles.image}
        imageStyle={styles.imageInner}
      >
        <View style={styles.overlay} />
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{name}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInner: {
    borderRadius: 24,
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceContainer,
    opacity: 0.3,
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
});
