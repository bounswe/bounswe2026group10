import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

interface HeroImageProps {
  imageUrl: string;
}

export function HeroImage({ imageUrl }: HeroImageProps) {
  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
