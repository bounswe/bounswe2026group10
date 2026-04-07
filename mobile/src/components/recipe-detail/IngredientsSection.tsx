import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  const scaleFactor = servings / baseServings;

  return (
    <SectionHeader title={t('recipeDetail.ingredients')} rightElement={servingAdjuster}>
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
