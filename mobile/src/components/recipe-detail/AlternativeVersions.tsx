import React from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import type { RecipeCard } from '../../types/recipe';
import { RecipeCardSmall } from '../shared/RecipeCardSmall';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface AlternativeVersionsProps {
  cards: RecipeCard[];
  onCardPress?: (card: RecipeCard) => void;
}

export function AlternativeVersions({ cards, onCardPress }: AlternativeVersionsProps) {
  if (cards.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alternative Versions</Text>
      <FlatList
        data={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCardSmall
            card={item}
            onPress={() =>
              onCardPress
                ? onCardPress(item)
                : Alert.alert(item.title, 'Navigation coming soon')
            }
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing['2xl'],
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  list: {
    paddingRight: spacing.lg,
  },
});
