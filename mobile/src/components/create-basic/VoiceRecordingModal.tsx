import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { parseRecipeAudio } from '../../api/parse';
import type { ParseRecipeResponse } from '../../api/parse';
import { useRecipeForm } from '../../context/RecipeFormContext';
import type { MeasurementUnit } from '../../types/common';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplied: (title: string) => void;
}

function mapToMeasurementUnit(raw: string): MeasurementUnit {
  const s = raw.toLowerCase().trim();
  if (s === 'g' || s === 'gram' || s === 'grams') return 'g';
  if (s === 'kg' || s === 'kilogram' || s === 'kilograms') return 'kg';
  if (s === 'ml' || s === 'milliliter' || s === 'milliliters' || s === 'millilitre' || s === 'millilitres') return 'ml';
  if (s === 'l' || s === 'liter' || s === 'liters' || s === 'litre' || s === 'litres') return 'L';
  if (s === 'cup' || s === 'cups') return 'cup';
  if (s === 'tbsp' || s === 'tbs' || s === 'tablespoon' || s === 'tablespoons') return 'tbsp';
  if (s === 'tsp' || s === 'teaspoon' || s === 'teaspoons') return 'tsp';
  if (s === 'piece' || s === 'pieces' || s === 'pc' || s === 'pcs') return 'piece';
  if (s === 'pinch' || s === 'pinches') return 'pinch';
  if (s === 'oz' || s === 'ounce' || s === 'ounces') return 'oz';
  if (s === 'lb' || s === 'lbs' || s === 'pound' || s === 'pounds') return 'lb';
  return 'piece';
}

type Phase = 'idle' | 'recording' | 'processing' | 'preview';

export function VoiceRecordingModal({ visible, onClose, onApplied }: Props) {
  const { t } = useTranslation('common');
  const { updateDraft } = useRecipeForm();

  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseRecipeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetState = useCallback(() => {
    setPhase('idle');
    setElapsed(0);
    setTranscription(null);
    setParsed(null);
    setError(null);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  // Cleanup on unmount or modal close
  useEffect(() => {
    if (!visible) {
      stopTimer();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      resetState();
    }
  }, [visible, stopTimer, resetState]);

  const handleClose = () => {
    if (phase === 'processing') return;
    onClose();
  };

  const handleStartRecording = async () => {
    setError(null);
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError(t('create.voice.errors.permissionDenied'));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      setPhase('recording');
      startTimer();
    } catch {
      setError(t('create.voice.errors.startFailed'));
    }
  };

  const handleStopRecording = async () => {
    stopTimer();
    setPhase('processing');

    const recording = recordingRef.current;
    if (!recording) {
      setError(t('create.voice.errors.generic'));
      setPhase('idle');
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        setError(t('create.voice.errors.generic'));
        setPhase('idle');
        return;
      }

      const result = await parseRecipeAudio(uri);
      setTranscription(result.transcription.text);
      setParsed(result.recipe);
      setPhase('preview');
    } catch (err) {
      let message = t('create.voice.errors.generic');
      if (err instanceof ApiError) {
        if (err.code === 'TRANSCRIPTION_TOO_SHORT') {
          message = t('create.voice.errors.tooShort');
        } else if (err.code === 'TRANSCRIPTION_FAILED') {
          message = t('create.voice.errors.transcriptionFailed');
        } else if (err.code === 'UNAUTHORIZED') {
          message = t('create.parse.errors.unauthorized');
        } else if (err.code === 'FORBIDDEN') {
          message = t('create.parse.errors.forbidden');
        } else {
          message = err.message;
        }
      } else if (err instanceof Error && (err.message.includes('network') || err.message.includes('fetch'))) {
        message = t('create.parse.errors.network');
      }
      setError(message);
      setPhase('idle');
    }
  };

  const handleApply = () => {
    if (!parsed) return;
    updateDraft({
      title: parsed.title,
      ingredients: parsed.ingredients.map((ing, i) => ({
        id: `voice-ing-${i}`,
        ingredientId: null,
        name: ing.name,
        quantity: String(ing.quantity),
        unit: mapToMeasurementUnit(ing.unit),
      })),
      steps: parsed.steps.map((s) => ({
        description: s.description,
        timestamp: '',
      })),
      tools: parsed.tools.map((tool, i) => ({
        id: `voice-tool-${i}`,
        name: tool.name,
      })),
    });
    onApplied(parsed.title);
    onClose();
  };

  const handleTryAgain = () => {
    resetState();
  };

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={phase !== 'processing' ? handleClose : undefined}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdropTap}
          onPress={handleClose}
        />

        <View style={styles.sheet}>
          {/* ── Idle: ready to record ── */}
          {phase === 'idle' && (
            <>
              <Text style={styles.title}>{t('create.voice.title')}</Text>
              <Text style={styles.subtitle}>{t('create.voice.subtitle')}</Text>

              {error !== null && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <TouchableOpacity
                style={styles.micButton}
                onPress={handleStartRecording}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="microphone" size={40} color={colors.white} />
              </TouchableOpacity>

              <Text style={styles.tapHint}>{t('create.voice.tapToStart')}</Text>

              <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Recording ── */}
          {phase === 'recording' && (
            <>
              <Text style={styles.title}>{t('create.voice.recording')}</Text>
              <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>

              <TouchableOpacity
                style={[styles.micButton, styles.micButtonRecording]}
                onPress={handleStopRecording}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="stop" size={36} color={colors.white} />
              </TouchableOpacity>

              <Text style={styles.tapHint}>{t('create.voice.tapToStop')}</Text>
            </>
          )}

          {/* ── Processing ── */}
          {phase === 'processing' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('create.voice.processing')}</Text>
            </View>
          )}

          {/* ── Preview ── */}
          {phase === 'preview' && parsed !== null && (
            <>
              <Text style={styles.title}>{t('create.parse.parsedTitle')}</Text>

              {transcription !== null && (
                <View style={styles.transcriptionBox}>
                  <Text style={styles.transcriptionLabel}>{t('create.voice.transcriptionLabel')}</Text>
                  <Text style={styles.transcriptionText} numberOfLines={4}>
                    {transcription}
                  </Text>
                </View>
              )}

              <Text style={styles.parsedRecipeTitle}>{parsed.title}</Text>

              <View style={styles.chips}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {t('create.parse.chips.ingredients', { count: parsed.ingredients.length })}
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {t('create.parse.chips.steps', { count: parsed.steps.length })}
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {t('create.parse.chips.tools', { count: parsed.tools.length })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleApply}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>{t('create.parse.apply')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ghostButton}
                onPress={handleTryAgain}
                activeOpacity={0.7}
              >
                <Text style={styles.ghostButtonText}>{t('create.voice.recordAgain')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  micButtonRecording: {
    backgroundColor: colors.negative,
    shadowColor: colors.negative,
  },
  tapHint: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  timer: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes['3xl'],
    color: colors.negative,
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  transcriptionBox: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  transcriptionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  transcriptionText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
    lineHeight: 20,
  },
  parsedRecipeTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
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
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  ghostButtonText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
