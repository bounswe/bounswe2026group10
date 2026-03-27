import React from 'react';
import { View } from 'react-native';
import type { Ingredient } from '../../types/ingredient';
import { SectionHeader } from '../shared/SectionHeader';
import { IngredientRow } from './IngredientRow';

interface IngredientsSectionProps {
  ingredients: Ingredient[];
  baseServings: number;
  servings: number;
  servingAdjuster?: React.ReactNode;
}

export function IngredientsSection({
  ingredients,
  baseServings,
  servings,
  servingAdjuster,
}: IngredientsSectionProps) {
  const scaleFactor = servings / baseServings;

  return (
    <SectionHeader title="Ingredients" rightElement={servingAdjuster}>
      <View>
        {ingredients.map((ingredient) => (
          <IngredientRow
            key={ingredient.id}
            ingredient={ingredient}
            scaledQuantity={ingredient.quantity * scaleFactor}
          />
        ))}
      </View>
    </SectionHeader>
  );
}
