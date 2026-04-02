import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, fontSizes, spacing } from "../../theme";
import { IconButton } from "../shared/IconButton";
import { StepHeader } from "../create-basic/StepHeader";
import { useRecipeForm } from "../../context/RecipeFormContext";
import { createRecipe, publishRecipe } from "../../api/recipes";
import type { RecipeFormState } from "../../context/RecipeFormContext";

function buildPayload(draft: RecipeFormState) {
  return {
    title: draft.title,
    type: draft.type.toLowerCase() as "community" | "cultural",
    story: draft.story || undefined,
    dishVarietyId: draft.varietyId ?? undefined,
    servingSize: draft.servingSize,
    videoUrl: draft.videoUrl ?? undefined,
    tagIds: [...draft.dietaryTagIds, ...draft.allergenTagIds],
    ingredients: draft.ingredients
      .filter((ing) => ing.name.trim() && ing.ingredientId !== null)
      .map((ing) => ({
        ingredientId: ing.ingredientId as number,
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
      })),
    steps: draft.steps.map((s, i) => ({
      stepOrder: i + 1,
      description: s.description || s.title,
    })),
    tools: draft.tools.map((t) => ({ name: t.name })),
  };
}

export function CreateReviewScreen() {
  const navigation = useNavigation();
  const { draft, resetDraft } = useRecipeForm();
  const [publishing, setPublishing] = useState(false);

  const tagCount = draft.dietaryTagIds.length + draft.allergenTagIds.length;

  const metaParts = [draft.originCountry].filter(Boolean);

  const goHome = () => {
    resetDraft();
    navigation.getParent()?.navigate("HomeTab" as never);
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const created = await createRecipe({
        ...buildPayload(draft),
        isPublished: false,
      });
      console.log("[publish] recipe created:", created.id);
      const published = await publishRecipe(created.id);
      console.log("[publish] recipe published:", published);
      Alert.alert("Published!", "Your recipe is now live.", [
        { text: "OK", onPress: goHome },
      ]);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    const result = await createRecipe({
      ...buildPayload(draft),
      isPublished: false,
    });
    console.log("[draft] recipe saved:", result.id);
    Alert.alert("Draft Saved", "Your recipe has been saved to drafts.", [
      { text: "OK", onPress: goHome },
    ]);
  };

  const handleClose = () => {
    Alert.alert("Discard Recipe?", "Your changes will be lost.", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", style: "destructive" },
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
      >
        <StepHeader
          currentStep={4}
          totalSteps={4}
          title="Review"
          subtitle="Almost there — give your recipe one last look."
        />

        {/* Recipe title */}
        <Text style={styles.recipeTitle}>
          {draft.title || "Untitled Recipe"}
        </Text>

        {/* Metadata row */}
        {metaParts.length > 0 && (
          <Text style={styles.metaRow}>{metaParts.join(" · ")}</Text>
        )}

        {/* Story */}
        {!!draft.story && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>STORY</Text>
            <Text style={styles.bodyText}>{draft.story}</Text>
          </View>
        )}

        {/* Tags */}
        {tagCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TAGS</Text>
            <Text style={styles.bodyText}>
              {tagCount} tag{tagCount !== 1 ? "s" : ""} selected
            </Text>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INGREDIENTS</Text>
          {draft.ingredients
            .filter((i) => i.name.trim())
            .map((ing) => (
              <Text key={ing.id} style={styles.listItem}>
                {"• "}
                {ing.name}
                {ing.quantity ? `  ${ing.quantity} ${ing.unit}` : ""}
              </Text>
            ))}
          {draft.ingredients.filter((i) => i.name.trim()).length === 0 && (
            <Text style={styles.emptyText}>No ingredients added</Text>
          )}
        </View>

        {/* Tools */}
        {draft.tools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TOOLS</Text>
            {draft.tools.map((tool) => (
              <Text key={tool.id} style={styles.listItem}>
                {"• "}
                {tool.name}
              </Text>
            ))}
          </View>
        )}

        {/* Video */}
        {!!draft.videoFileName && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECIPE VIDEO</Text>
            <View style={styles.videoRow}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={colors.positive}
              />
              <Text style={styles.videoAttachedText}>
                {draft.videoFileName}
              </Text>
            </View>
          </View>
        )}

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STEPS</Text>
          {draft.steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepCircleText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                {!!step.timestamp && (
                  <Text style={styles.stepTimestamp}>{step.timestamp}</Text>
                )}
              </View>
              {!!step.description && (
                <Text style={styles.stepDescription}>{step.description}</Text>
              )}
            </View>
          ))}
          {draft.steps.length === 0 && (
            <Text style={styles.emptyText}>No steps added</Text>
          )}
        </View>

        {/* Navigation */}
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
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.publishButton,
            publishing && styles.publishButtonDisabled,
          ]}
          onPress={handlePublish}
          activeOpacity={0.8}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.publishButtonText}>Publish Recipe</Text>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={colors.white}
              />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveDraftButton}
          onPress={handleSaveDraft}
          activeOpacity={0.7}
        >
          <Text style={styles.saveDraftText}>Save as Draft</Text>
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
  recipeTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes["3xl"],
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  metaRow: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: spacing["2xl"],
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  listItem: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  stepCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stepCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  stepTitle: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  stepDescription: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    marginLeft: 28 + spacing.sm,
  },
  videoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  videoAttachedText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.positive,
    flex: 1,
  },
  stepTimestamp: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginLeft: "auto",
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
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
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
