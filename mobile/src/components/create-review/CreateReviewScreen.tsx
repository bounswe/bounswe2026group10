import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { CreateStackParamList } from "../../navigation/types";
import { colors, fonts, fontSizes, spacing } from "../../theme";
import { IconButton } from "../shared/IconButton";
import { StepHeader } from "../create-basic/StepHeader";
import { useTranslation } from "react-i18next";
import { useRecipeForm } from "../../context/RecipeFormContext";
import { attachRecipeMedia, createRecipe, publishRecipe } from "../../api/recipes";
import { buildRecipePayload } from "../../utils/buildRecipePayload";
import { validateForPublish } from "../../utils/recipeValidation";

export function CreateReviewScreen() {
  const { t } = useTranslation("common");
  const navigation = useNavigation<NativeStackNavigationProp<CreateStackParamList>>();
  const { draft, resetDraft } = useRecipeForm();
  const [publishing, setPublishing] = useState(false);

  const hasDietaryTags = draft.dietaryTagNames.length > 0;
  const hasAllergenTags = draft.allergenTagNames.length > 0;

  const metaParts = [draft.originCountry].filter(Boolean);

  const goHome = () => {
    resetDraft();
    navigation.popToTop();
    navigation.getParent()?.navigate("HomeTab" as never);
  };

  const attachMedia = async (recipeId: string) => {
    console.log('[attachMedia] recipeId:', recipeId, 'imageUrls:', draft.imageUrls, 'videoUrl:', draft.videoUrl);
    const imageAttachments = draft.imageUrls.map((url) => {
      console.log('[attachMedia] attaching image:', url);
      return attachRecipeMedia(recipeId, url, 'image').then((res) => {
        console.log('[attachMedia] image attached OK:', url);
        return res;
      }).catch((err) => {
        console.error('[attachMedia] FAILED to attach image:', url, err);
        throw err;
      });
    });
    const videoAttachment = draft.videoUrl
      ? [attachRecipeMedia(recipeId, draft.videoUrl, 'video').then((res) => {
          console.log('[attachMedia] video attached OK:', draft.videoUrl);
          return res;
        }).catch((err) => {
          console.error('[attachMedia] FAILED to attach video:', draft.videoUrl, err);
          throw err;
        })]
      : [];
    await Promise.all([...imageAttachments, ...videoAttachment]);
    console.log('[attachMedia] all media attached for recipe:', recipeId);
  };

  const handlePublish = async () => {
    const missing = validateForPublish(draft);
    if (missing.length > 0) {
      Alert.alert(
        t('create.incompleteTitle'),
        'Please complete the following before publishing:\n\n' +
          missing.map((m) => `• ${m}`).join('\n')
      );
      return;
    }
    try {
      setPublishing(true);
      const created = await createRecipe({
        ...buildRecipePayload(draft),
        isPublished: false,
      });
      console.log("[publish] recipe created:", created.id);
      await attachMedia(created.id);
      const published = await publishRecipe(created.id);
      console.log("[publish] recipe published:", published);
      Alert.alert(t("create.published"), t("create.publishedMsg"), [
        { text: "OK", onPress: goHome },
      ]);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    const result = await createRecipe({
      ...buildRecipePayload(draft),
      isPublished: false,
    });
    console.log("[draft] recipe saved:", result.id);
    await attachMedia(result.id);
    Alert.alert(t("create.draftSaved"), t("create.draftSavedMsg2"), [
      { text: "OK", onPress: goHome },
    ]);
  };

  const handleClose = () => {
    Alert.alert(t("create.discardTitle"), t("create.discardMsg"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("create.discard"), style: "destructive", onPress: goHome },
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
          title={t("create.steps.4")}
          subtitle={t("create.steps.4subtitle")}
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
            <Text style={styles.sectionLabel}>{t("create.review.story").toUpperCase()}</Text>
            <Text style={styles.bodyText}>{draft.story}</Text>
          </View>
        )}

        {/* Images */}
        {draft.imageUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("create.review.images").toUpperCase()}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageStrip}
            >
              {draft.imageUrls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.reviewImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Dietary tags */}
        {hasDietaryTags && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("create.review.dietaryTags").toUpperCase()}</Text>
            <View style={styles.tagRow}>
              {draft.dietaryTagNames.map((name) => (
                <View key={name} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Allergen tags */}
        {hasAllergenTags && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("create.review.allergenTags").toUpperCase()}</Text>
            <View style={styles.tagRow}>
              {draft.allergenTagNames.map((name) => (
                <View key={name} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("create.review.ingredients").toUpperCase()}</Text>
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
            <Text style={styles.emptyText}>{t("create.review.noIngredients")}</Text>
          )}
        </View>

        {/* Tools */}
        {draft.tools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t("create.review.tools").toUpperCase()}</Text>
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
            <Text style={styles.sectionLabel}>{t("create.review.video").toUpperCase()}</Text>
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
          <Text style={styles.sectionLabel}>{t("create.review.steps").toUpperCase()}</Text>
          {draft.steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepCircleText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepDescription} numberOfLines={2}>{step.description}</Text>
                {!!step.timestamp && (
                  <Text style={styles.stepTimestamp}>{step.timestamp}</Text>
                )}
              </View>
            </View>
          ))}
          {draft.steps.length === 0 && (
            <Text style={styles.emptyText}>{t("create.review.noSteps")}</Text>
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
            <Text style={styles.backButtonText}>{t("common.back")}</Text>
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
              <Text style={styles.publishButtonText}>{t("create.review.publish")}</Text>
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
          <Text style={styles.saveDraftText}>{t("create.review.saveDraft")}</Text>
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
  stepDescription: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginHorizontal: spacing.sm,
  },
  imageStrip: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
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
