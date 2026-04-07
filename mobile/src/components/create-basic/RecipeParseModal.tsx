import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/client";
import { parseRecipeText } from "../../api/parse";
import type { ParseRecipeResponse } from "../../api/parse";
import { useRecipeForm } from "../../context/RecipeFormContext";
import type { MeasurementUnit } from "../../types/common";
import { colors, fonts, fontSizes, spacing } from "../../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplied: (title: string) => void;
}

function mapToMeasurementUnit(raw: string): MeasurementUnit {
  const s = raw.toLowerCase().trim();
  if (s === "g" || s === "gram" || s === "grams") return "g";
  if (s === "kg" || s === "kilogram" || s === "kilograms") return "kg";
  if (
    s === "ml" ||
    s === "milliliter" ||
    s === "milliliters" ||
    s === "millilitre" ||
    s === "millilitres"
  )
    return "ml";
  if (
    s === "l" ||
    s === "liter" ||
    s === "liters" ||
    s === "litre" ||
    s === "litres"
  )
    return "L";
  if (s === "cup" || s === "cups") return "cup";
  if (s === "tbsp" || s === "tbs" || s === "tablespoon" || s === "tablespoons")
    return "tbsp";
  if (s === "tsp" || s === "teaspoon" || s === "teaspoons") return "tsp";
  if (s === "piece" || s === "pieces" || s === "pc" || s === "pcs")
    return "piece";
  if (s === "pinch" || s === "pinches") return "pinch";
  if (s === "oz" || s === "ounce" || s === "ounces") return "oz";
  if (s === "lb" || s === "lbs" || s === "pound" || s === "pounds") return "lb";
  return "piece";
}

type Phase = "input" | "loading" | "preview";

export function RecipeParseModal({ visible, onClose, onApplied }: Props) {
  const { t } = useTranslation("common");
  const { updateDraft } = useRecipeForm();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [parsed, setParsed] = useState<ParseRecipeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTextValid = text.length >= 10 && text.length <= 5000;

  const handleClose = () => {
    setText("");
    setPhase("input");
    setParsed(null);
    setError(null);
    onClose();
  };

  const handleBackdropPress = () => {
    if (phase !== "loading") {
      handleClose();
    }
  };

  const handleParse = async () => {
    setError(null);
    setPhase("loading");
    try {
      const result = await parseRecipeText(text);
      setParsed(result);
      setPhase("preview");
    } catch (err) {
      let message = t("create.parse.errors.generic");
      if (err instanceof ApiError) {
        if (err.code === "VALIDATION_ERROR") {
          message = t("create.parse.errors.validation");
        } else if (err.code === "UNAUTHORIZED") {
          message = t("create.parse.errors.unauthorized");
        } else if (err.code === "FORBIDDEN") {
          message = t("create.parse.errors.forbidden");
        } else {
          message = err.message;
        }
      } else if (
        err instanceof Error &&
        (err.message.includes("network") || err.message.includes("fetch"))
      ) {
        message = t("create.parse.errors.network");
      }
      setError(message);
      setPhase("input");
    }
  };

  const handleApply = () => {
    if (!parsed) return;
    updateDraft({
      title: parsed.title,
      ingredients: parsed.ingredients.map((ing, i) => ({
        id: `parsed-ing-${i}`,
        ingredientId: null,
        name: ing.name,
        quantity: String(ing.quantity),
        unit: mapToMeasurementUnit(ing.unit),
      })),
      steps: parsed.steps.map((s) => ({
        description: s.description,
        timestamp: "",
      })),
      tools: parsed.tools.map((t, i) => ({
        id: `parsed-tool-${i}`,
        name: t.name,
      })),
    });
    onApplied(parsed.title);
    handleClose();
  };

  const handleTryAgain = () => {
    setParsed(null);
    setPhase("input");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={phase !== "loading" ? handleClose : undefined}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdropTap} onPress={handleBackdropPress} />

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          pointerEvents="box-none"
        >
          <View style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {phase === "input" && (
                <>
                  <Text style={styles.title}>{t("create.parse.title")}</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    placeholder={t("create.parse.placeholder")}
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={text}
                    onChangeText={setText}
                    textAlignVertical="top"
                  />
                  <Text
                    style={[
                      styles.charCount,
                      !isTextValid && text.length > 0
                        ? styles.charCountError
                        : null,
                    ]}
                  >
                    {text.length} / 5000
                  </Text>
                  {error !== null && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      !isTextValid && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleParse}
                    disabled={!isTextValid}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>{t("create.parse.parseButton")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                  </TouchableOpacity>
                </>
              )}

              {phase === "loading" && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>{t("create.parse.analysing")}</Text>
                </View>
              )}

              {phase === "preview" && parsed !== null && (
                <>
                  <Text style={styles.title}>{t("create.parse.parsedTitle")}</Text>
                  <Text style={styles.parsedTitle}>{parsed.title}</Text>
                  <View style={styles.chips}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {t("create.parse.chips.ingredients", { count: parsed.ingredients.length })}
                      </Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {t("create.parse.chips.steps", { count: parsed.steps.length })}
                      </Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {t("create.parse.chips.tools", { count: parsed.tools.length })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleApply}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>
                      {t("create.parse.apply")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ghostButton}
                    onPress={handleTryAgain}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ghostButtonText}>{t("create.parse.tryAgain")}</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    overflow: "hidden",
  },
  sheetContent: {
    padding: spacing["2xl"],
    paddingBottom: spacing["3xl"],
  },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    height: 180,
    marginBottom: spacing.xs,
  },
  charCount: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  charCountError: {
    color: colors.negative,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    gap: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  parsedTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  ghostButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  ghostButtonText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
});
