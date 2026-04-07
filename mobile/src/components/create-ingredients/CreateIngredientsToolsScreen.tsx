import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Tool } from "../../types/ingredient";
import { colors, fonts, fontSizes, spacing } from "../../theme";
import { IconButton } from "../shared/IconButton";
import { SectionHeader } from "../shared/SectionHeader";
import { StepHeader } from "../create-basic/StepHeader";
import { IngredientRowEditor } from "./IngredientRowEditor";
import type { IngredientFormItem } from "./IngredientRowEditor";
import { ToolSearchSection } from "./ToolSearchSection";
import { useTranslation } from "react-i18next";
import { useRecipeForm } from "../../context/RecipeFormContext";
import { validateIngredients } from "../../utils/recipeValidation";
import { searchIngredients } from "../../api/ingredients";
import type { IngredientItem } from "../../api/ingredients";
import { getTools } from "../../api/tools";
import type { ToolItem } from "../../api/tools";

let nextId = 1;
function generateId(): string {
  return String(nextId++);
}

function createEmptyIngredient(): IngredientFormItem {
  return {
    id: generateId(),
    ingredientId: null,
    name: "",
    quantity: "",
    unit: "g",
  };
}

export function CreateIngredientsToolsScreen() {
  const { t } = useTranslation("common");
  const navigation =
    useNavigation<NativeStackNavigationProp<CreateStackParamList>>();
  const isFocused = useIsFocused();
  const { draft, updateDraft, resetDraft } = useRecipeForm();
  const [ingredients, setIngredients] = useState<IngredientFormItem[]>(
    draft.ingredients.length > 0
      ? draft.ingredients
      : [createEmptyIngredient()],
  );
  const [tools, setTools] = useState<Tool[]>(draft.tools);
  const [errors, setErrors] = useState<
    Record<string, { name?: string; quantity?: string }>
  >({});
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [allTools, setAllTools] = useState<ToolItem[]>([]);

  useEffect(() => {
    if (!isFocused) return;
    setIngredients(
      draft.ingredients.length > 0
        ? draft.ingredients
        : [createEmptyIngredient()],
    );
    setTools(draft.tools);
    setErrors({});
  }, [isFocused]);

  useEffect(() => {
    searchIngredients("")
      .then((data) => {
        console.log(
          "[Ingredients] loaded",
          data.length,
          "ingredients from backend",
        );
        setAllIngredients(data);
        // Auto-match parsed ingredients that have a name but no DB id yet
        setIngredients((prev) =>
          prev.map((ing) => {
            if (ing.name.trim() && ing.ingredientId === null) {
              const match = data.find(
                (ai) => ai.name.toLowerCase() === ing.name.toLowerCase(),
              );
              if (match) return { ...ing, ingredientId: match.id };
              console.warn(
                "[Ingredients] no DB match for parsed ingredient:",
                ing.name,
              );
            }
            return ing;
          }),
        );
      })
      .catch((err) => console.error("[Ingredients] failed to load:", err));
    getTools()
      .then((data) => {
        console.log("[Tools] loaded", data.length, "tools from backend");
        setAllTools(data);
      })
      .catch((err) => console.error("[Tools] failed to load:", err));
  }, []);

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
    const newErrors = validateIngredients(ingredients);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateDraft({ ingredients, tools });
      navigation.navigate("CreateSteps");
    }
  };

  const handleSaveDraft = () => {
    Alert.alert(t("create.draftSaved"), t("create.draftSavedMsg"));
  };

  const handleClose = () => {
    Alert.alert(t("create.discardTitle"), t("create.discardMsg"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("create.discard"),
        style: "destructive",
        onPress: () => {
          resetDraft();
          navigation.popToTop();
          navigation.getParent()?.navigate("HomeTab" as never);
        },
      },
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
          title={t("create.steps.2")}
          subtitle={t("create.steps.2subtitle")}
        />

        <SectionHeader
          title={t("create.ingredients.title")}
          rightElement={
            <TouchableOpacity
              onPress={handleAddIngredient}
              style={styles.addButton}
            >
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.addButtonText}>{t("create.ingredients.add")}</Text>
            </TouchableOpacity>
          }
        >
          {ingredients.map((ingredient) => (
            <IngredientRowEditor
              key={ingredient.id}
              ingredient={ingredient}
              allIngredients={allIngredients}
              onUpdate={(updated) =>
                handleUpdateIngredient(ingredient.id, updated)
              }
              onRemove={() => handleRemoveIngredient(ingredient.id)}
              error={errors[ingredient.id]}
            />
          ))}
        </SectionHeader>

        <SectionHeader title={t("create.tools.title")}>
          <ToolSearchSection
            allTools={allTools}
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
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={colors.onSurface}
            />
            <Text style={styles.backButtonText}>{t("common.back")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>{t("create.continueSteps")}</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveDraftButton}
          onPress={handleSaveDraft}
          activeOpacity={0.7}
        >
          <Text style={styles.saveDraftText}>{t("create.saveDraft")}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logoText: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
    textAlign: "center",
  },
  topBarSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  addButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  navigationRow: {
    marginTop: spacing["3xl"],
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  saveDraftText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurfaceVariant,
  },
});
