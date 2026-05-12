import React, { useEffect, useMemo, useState } from "react";
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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { CreateStackParamList } from "../../navigation/types";
import { colors, fonts, fontSizes, spacing } from "../../theme";
import { IconButton } from "../shared/IconButton";
import { ChipSelector } from "../shared/ChipSelector";
import { StepHeader } from "../create-basic/StepHeader";
import { useRecipeForm } from "../../context/RecipeFormContext";
import {
  detectAllergens,
  getAllergens,
  type AllergenItem,
} from "../../api/allergens";

export function CreateAllergensScreen() {
  const { t, i18n } = useTranslation("common");
  const navigation =
    useNavigation<NativeStackNavigationProp<CreateStackParamList>>();
  const { draft, updateDraft, resetDraft, saveDraft } = useRecipeForm();
  const [savingDraft, setSavingDraft] = useState(false);

  const ingredientIds = useMemo(
    () =>
      draft.ingredients
        .map((ing) => ing.ingredientId)
        .filter((id): id is number => id !== null),
    [draft.ingredients],
  );
  const hasIngredients = ingredientIds.length > 0;

  const [allAllergens, setAllAllergens] = useState<AllergenItem[]>([]);
  const [detected, setDetected] = useState<AllergenItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    draft.allergenTagIds.map(String),
  );
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(hasIngredients);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    getAllergens()
      .then((data) => {
        console.log("[Allergens] loaded", data.length, "allergens");
        setAllAllergens(data);
      })
      .catch((err) => {
        console.error("[Allergens] failed to load:", err);
        setLoadError(t("create.allergens.loadError"));
      })
      .finally(() => setLoading(false));

    if (hasIngredients) {
      setDetecting(true);
      setDetectError(null);
      detectAllergens(ingredientIds)
        .then((data) => {
          console.log("[Allergens] detected", data.length, "from ingredients");
          setDetected(data);
          // Merge detected ids with anything the user had previously selected.
          setSelectedIds((prev) => {
            const merged = new Set<string>(prev);
            data.forEach((a) => merged.add(String(a.id)));
            return Array.from(merged);
          });
        })
        .catch((err) => {
          console.error("[Allergens] detect failed:", err);
          setDetectError(t("create.allergens.detectError"));
        })
        .finally(() => setDetecting(false));
    } else {
      setDetected([]);
      setDetecting(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const chipOptions = useMemo(
    () =>
      allAllergens.map((a) => ({ label: a.name, value: String(a.id) })),
    [allAllergens],
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    const selectedSet = new Set(selectedIds);
    const idsNum: number[] = [];
    const names: string[] = [];
    allAllergens.forEach((a) => {
      if (selectedSet.has(String(a.id))) {
        idsNum.push(a.id);
        names.push(a.name);
      }
    });
    // If the allergen list failed to load but the user had some pre-selected /
    // detected ids, preserve them so we don't silently drop allergens.
    if (idsNum.length === 0 && selectedIds.length > 0) {
      const detectedById = new Map(detected.map((a) => [String(a.id), a]));
      selectedIds.forEach((sid) => {
        const numeric = Number(sid);
        if (Number.isFinite(numeric)) {
          const item = detectedById.get(sid);
          idsNum.push(numeric);
          names.push(item?.name ?? "");
        }
      });
    }
    updateDraft({
      allergenTagIds: idsNum,
      allergenTagNames: names,
    });
    navigation.navigate("CreateSteps");
  };

  const handleSaveDraft = async () => {
    const selectedSet = new Set(selectedIds);
    const idsNum: number[] = [];
    const names: string[] = [];
    allAllergens.forEach((a) => {
      if (selectedSet.has(String(a.id))) {
        idsNum.push(a.id);
        names.push(a.name);
      }
    });
    try {
      setSavingDraft(true);
      await saveDraft({ allergenTagIds: idsNum, allergenTagNames: names });
      Alert.alert(t("create.draftSaved"), t("create.draftSavedMsg2"), [
        {
          text: "OK",
          onPress: () => {
            resetDraft();
            navigation.navigate("CreateBasicInfo" as never);
            navigation.getParent()?.navigate("HomeTab" as never);
          },
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save draft. Please try again.");
    } finally {
      setSavingDraft(false);
    }
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
          currentStep={3}
          totalSteps={5}
          title={t("create.steps.3")}
          subtitle={t("create.steps.3subtitle")}
        />

        {/* Detected section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t("create.allergens.detectedTitle").toUpperCase()}
          </Text>

          {!hasIngredients ? (
            <View style={styles.infoBanner}>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.infoBannerText}>
                {t("create.allergens.noIngredientsHint")}
              </Text>
            </View>
          ) : detecting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : detectError ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color={colors.negative}
              />
              <Text style={styles.errorBannerText}>{detectError}</Text>
            </View>
          ) : detected.length === 0 ? (
            <Text style={styles.emptyHint}>
              {t("create.allergens.detectedEmpty")}
            </Text>
          ) : (
            <>
              <View style={styles.detectedChips}>
                {detected.map((a) => (
                  <View key={a.id} style={styles.detectedChip}>
                    <MaterialCommunityIcons
                      name="auto-fix"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.detectedChipText}>{a.name}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.detectedHint}>
                {t("create.allergens.detectedHint")}
              </Text>
            </>
          )}
        </View>

        {/* Full manual selector */}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : loadError ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={colors.negative}
            />
            <Text style={styles.errorBannerText}>{loadError}</Text>
            <TouchableOpacity onPress={load} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>
                {t("create.allergens.retry")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ChipSelector
            label={t("create.allergens.allTitle")}
            options={chipOptions}
            selected={selectedIds}
            onToggle={toggleSelected}
          />
        )}

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
          disabled={savingDraft}
        >
          {savingDraft ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveDraftText}>{t("create.saveDraft")}</Text>
          )}
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  detectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainer,
  },
  detectedChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  detectedHint: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  emptyHint: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    fontStyle: "italic",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.negative,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.negative,
  },
  retryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.negative,
  },
  loadingRow: {
    paddingVertical: spacing.md,
    alignItems: "center",
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
