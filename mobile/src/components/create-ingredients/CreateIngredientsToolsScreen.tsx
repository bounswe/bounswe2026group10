import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Tool } from '../../types/ingredient';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { IconButton } from '../shared/IconButton';
import { SectionHeader } from '../shared/SectionHeader';
import { StepHeader } from '../create-basic/StepHeader';
import { IngredientRowEditor } from './IngredientRowEditor';
import type { IngredientFormItem } from './IngredientRowEditor';
import { ToolSearchSection } from './ToolSearchSection';
import { useRecipeForm } from '../../context/RecipeFormContext';

let nextId = 1;
function generateId(): string {
  return String(nextId++);
}

function createEmptyIngredient(): IngredientFormItem {
  return { id: generateId(), ingredientId: null, name: '', quantity: '', unit: 'g' };
}

export function CreateIngredientsToolsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CreateStackParamList>>();
  const { updateDraft } = useRecipeForm();
  const [ingredients, setIngredients] = useState<IngredientFormItem[]>([
    createEmptyIngredient(),
  ]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [errors, setErrors] = useState<Record<string, { name?: string; quantity?: string }>>({});

  const handleAddIngredient = () => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  };

  const handleUpdateIngredient = (id: string, updated: IngredientFormItem) => {
    setIngredients((prev) => prev.map((i) => (i.id === id ? updated : i)));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddTool = (tool: Tool) => {
    if (!tools.some((t) => t.id === tool.id)) {
      setTools((prev) => [...prev, tool]);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setTools((prev) => prev.filter((t) => t.id !== toolId));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, { name?: string; quantity?: string }> = {};
    let hasValidIngredient = false;

    for (const ing of ingredients) {
      const rowError: { name?: string; quantity?: string } = {};
      if (ing.name.trim()) {
        hasValidIngredient = true;
        const qty = parseFloat(ing.quantity);
        if (!ing.quantity.trim() || isNaN(qty) || qty <= 0) {
          rowError.quantity = 'Enter a valid quantity';
        }
      }
      if (Object.keys(rowError).length > 0) {
        newErrors[ing.id] = rowError;
      }
    }

    if (!hasValidIngredient) {
      const firstId = ingredients[0].id;
      newErrors[firstId] = {
        ...newErrors[firstId],
        name: 'Add at least one ingredient',
      };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateDraft({ ingredients, tools });
      navigation.navigate('CreateSteps');
    }
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your recipe draft has been saved.');
  };

  const handleClose = () => {
    Alert.alert('Discard Recipe?', 'Your changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton name="close" onPress={handleClose} />
        <Text style={styles.logoText}>Roots & Recipes</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepHeader
          currentStep={2}
          totalSteps={4}
          title="Ingredients & Tools"
          subtitle="The soul of your dish lies in the details."
        />

        <SectionHeader
          title="Ingredients"
          rightElement={
            <TouchableOpacity onPress={handleAddIngredient} style={styles.addButton}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          }
        >
          {ingredients.map((ingredient) => (
            <IngredientRowEditor
              key={ingredient.id}
              ingredient={ingredient}
              onUpdate={(updated) => handleUpdateIngredient(ingredient.id, updated)}
              onRemove={() => handleRemoveIngredient(ingredient.id)}
              error={errors[ingredient.id]}
            />
          ))}
        </SectionHeader>

        <SectionHeader title="Tools & Equipment">
          <ToolSearchSection
            selectedTools={tools}
            onAddTool={handleAddTool}
            onRemoveTool={handleRemoveTool}
          />
        </SectionHeader>

        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Next: Steps</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft} activeOpacity={0.7}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logoText: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  navigationRow: {
    marginTop: spacing['3xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  nextButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  saveDraftButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  saveDraftText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurfaceVariant,
  },
});
