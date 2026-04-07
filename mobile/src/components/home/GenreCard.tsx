import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface GenreCardProps {
  id: number;
  name: string;
  onPress?: () => void;
}

export function GenreCard({ name, onPress }: GenreCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={styles.image}>
        <View style={styles.overlay} />
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{name}</Text>
        </View>
      </View>
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
    backgroundColor: colors.surfaceContainer,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.15,
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
