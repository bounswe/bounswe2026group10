import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MeasurementUnit } from '../../types/common';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { UNIT_OPTIONS } from '../../constants/ingredientsAndTools';
import { FormDropdown } from '../shared/FormDropdown';
import type { IngredientItem } from '../../api/ingredients';

export interface IngredientFormItem {
  id: string;
  ingredientId: number | null; // numeric DB id; null until selected from suggestions
  name: string;
  quantity: string;
  unit: MeasurementUnit;
}

interface IngredientRowEditorProps {
  ingredient: IngredientFormItem;
  allIngredients: IngredientItem[]; // full list fetched once by the parent screen
  onUpdate: (updated: IngredientFormItem) => void;
  onRemove: () => void;
  error?: { name?: string; quantity?: string };
}

export function IngredientRowEditor({
  ingredient,
  allIngredients,
  onUpdate,
  onRemove,
  error,
}: IngredientRowEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const query = ingredient.name.trim().toLowerCase();
  const suggestions = query.length > 0
    ? allIngredients
        .filter((i) => i.name.toLowerCase().startsWith(query))
        .slice(0, 5)
    : [];

  const handleNameChange = (text: string) => {
    onUpdate({ ...ingredient, name: text, ingredientId: null });
    setShowSuggestions(text.length > 0);
  };

  const handleSelectSuggestion = (item: IngredientItem) => {
    onUpdate({ ...ingredient, name: item.name, ingredientId: item.id });
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.nameContainer}>
          <Text style={styles.fieldLabel}>INGREDIENT NAME</Text>
          <TextInput
            style={[styles.input, error?.name && styles.inputError]}
            value={ingredient.name}
            onChangeText={handleNameChange}
            placeholder="e.g. Fresh Basil"
            placeholderTextColor={colors.outline}
            onFocus={() => {
              if (ingredient.name.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ScrollView style={styles.suggestions} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {error?.name && <Text style={styles.errorText}>{error.name}</Text>}
        </View>

        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={22}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.quantityRow}>
        <View style={styles.quantityContainer}>
          <Text style={styles.fieldLabel}>QUANTITY</Text>
          <TextInput
            style={[styles.input, styles.quantityInput, error?.quantity && styles.inputError]}
            value={ingredient.quantity}
            onChangeText={(text) => onUpdate({ ...ingredient, quantity: text })}
            placeholder="0"
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
          />
          {error?.quantity && <Text style={styles.errorText}>{error.quantity}</Text>}
        </View>

        <View style={styles.unitContainer}>
          <Text style={styles.fieldLabel}>UNIT</Text>
          <FormDropdown
            label=""
            value={ingredient.unit}
            options={UNIT_OPTIONS}
            onSelect={(value) => onUpdate({ ...ingredient, unit: value as MeasurementUnit })}
            placeholder="Unit"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flex: 1,
    zIndex: 10,
  },
  fieldLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    paddingVertical: spacing.xs,
  },
  inputError: {
    borderBottomColor: colors.negative,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityInput: {
    // inherits from input
  },
  unitContainer: {
    flex: 1,
  },
  removeButton: {
    paddingLeft: spacing.sm,
    paddingTop: spacing.lg,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    maxHeight: 160,
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginTop: spacing.xs,
  },
});
