import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface MorePhotosSectionProps {
  images: string[];
}

export function MorePhotosSection({ images }: MorePhotosSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const extras = images.slice(1);
  return (
    <View style={styles.container}>
      <Pressable style={styles.headerRow} onPress={() => setExpanded((v) => !v)}>
        <MaterialCommunityIcons name="image-multiple" size={20} color={colors.primary} />
        <Text style={styles.headerText}>More Photos</Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary}
          style={styles.chevron}
        />
      </Pressable>
      {expanded && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          {extras.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chevron: {
    marginLeft: 'auto',
  },
  scroll: {
    marginTop: spacing.md,
  },
  headerText: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  thumbnail: {
    width: 110,
    height: 110,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
});
