import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Ingredient } from '../../types/ingredient';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface IngredientRowProps {
  ingredient: Ingredient;
  scaledQuantity: number;
}

function formatQuantity(quantity: number, unit: string): string {
  if (unit === 'piece') {
    return String(Math.round(quantity));
  }
  const formatted = parseFloat(quantity.toFixed(2));
  return String(formatted);
}

export function IngredientRow({ ingredient, scaledQuantity }: IngredientRowProps) {
  const handleSubstitute = () => {
    Alert.alert(
      `Substitutes for ${ingredient.name}`,
      ingredient.substitutes.join('\n'),
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        {formatQuantity(scaledQuantity, ingredient.unit)} {ingredient.unit}{' '}
        {ingredient.name}
      </Text>
      {ingredient.substitutionAvailable && (
        <TouchableOpacity onPress={handleSubstitute} style={styles.substituteButton}>
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.substituteText}>Substitute</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  substituteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  substituteText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
});
