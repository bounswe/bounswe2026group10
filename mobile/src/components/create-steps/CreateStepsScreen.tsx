import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { IconButton } from '../shared/IconButton';
import { StepHeader } from '../create-basic/StepHeader';
import { StepEditor } from './StepEditor';
import type { StepFormItem, StepFormItemErrors } from './StepEditor';
import { uploadVideo } from '../../api/video';
import { useRecipeForm } from '../../context/RecipeFormContext';
import type { CreateStackParamList } from '../../navigation/types';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

let nextId = 1;
function generateId(): string {
  return String(nextId++);
}

function createEmptyStep(): StepFormItem {
  return {
    id: generateId(),
    title: '',
    description: '',
    timestamp: '',
    isExpanded: true,
  };
}

export function CreateStepsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CreateStackParamList>>();
  const { draft, updateDraft, resetDraft } = useRecipeForm();

  // Single recipe video — restore from draft when coming back
  const [videoFileName, setVideoFileName] = useState<string | null>(draft.videoFileName);
  const [videoError, setVideoError] = useState<string | undefined>();
  // uploadedUrl is set as soon as the upload finishes (or restored from draft on back-nav)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(draft.videoUrl);
  const [uploading, setUploading] = useState(false);

  // Steps — restore from draft when coming back
  const [steps, setSteps] = useState<StepFormItem[]>(
    draft.steps.length > 0
      ? draft.steps.map((s) => ({ ...s, id: generateId(), isExpanded: false }))
      : [createEmptyStep()]
  );
  const [stepErrors, setStepErrors] = useState<Record<string, StepFormItemErrors>>({});

  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'] as ImagePicker.MediaType[],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'video.mp4';
    console.log('[video] local URI selected:', asset.uri);
    setVideoFileName(fileName);
    setUploadedUrl(null);
    setVideoError(undefined);
    setUploading(true);

    try {
      const { url } = await uploadVideo(asset.uri);
      console.log('[video] upload complete:', url);
      setUploadedUrl(url);
      updateDraft({ videoUrl: url, videoFileName: fileName });
    } catch (err: any) {
      setVideoFileName(null);
      setVideoError('Upload failed: ' + (err.message ?? 'please try again'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFileName(null);
    setUploadedUrl(null);
    updateDraft({ videoUrl: null, videoFileName: null });
  };

  const handleUpdateStep = (id: string, updated: StepFormItem) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (stepErrors[id]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleAddStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSteps((prev) => [...prev, createEmptyStep()]);
  };

  const handleDeleteStep = (id: string) => {
    if (steps.length <= 1) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validate = (): boolean => {
    let valid = true;

    if (uploading) {
      setVideoError('Please wait for the video to finish uploading');
      valid = false;
    } else if (!uploadedUrl) {
      setVideoError('A recipe video is required');
      valid = false;
    }

    const newErrors: Record<string, StepFormItemErrors> = {};
    for (const step of steps) {
      const rowError: StepFormItemErrors = {};
      if (!step.title.trim()) {
        rowError.title = 'Title is required';
      }
      if (step.timestamp.trim() && !/^\d{1,2}:\d{2}$/.test(step.timestamp.trim())) {
        rowError.timestamp = 'Use MM:SS format (e.g. 01:30)';
      }
      if (Object.keys(rowError).length > 0) {
        newErrors[step.id] = rowError;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setSteps((prev) =>
        prev.map((s) => (newErrors[s.id] ? { ...s, isExpanded: true } : s))
      );
      setStepErrors(newErrors);
      valid = false;
    }

    return valid;
  };

  const handleNext = () => {
    if (!validate()) return;

    updateDraft({
      steps: steps.map((s) => ({
        title: s.title,
        description: s.description,
        timestamp: s.timestamp,
      })),
    });
    navigation.navigate('CreateReview');
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your recipe draft has been saved.');
  };

  const handleClose = () => {
    Alert.alert('Discard Recipe?', 'Your changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          resetDraft();
          navigation.getParent()?.navigate('HomeTab' as never);
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
          totalSteps={4}
          title="Recipe Steps"
          subtitle="Break down the preparation into steps, just as they were taught to you."
        />

        {/* Single recipe video upload */}
        <View style={styles.videoSection}>
          <View style={styles.videoLabelRow}>
            <Text style={styles.videoLabel}>RECIPE VIDEO</Text>
            <Text style={styles.requiredStar}> *</Text>
          </View>

          {uploading ? (
            <View style={[styles.videoBox, styles.videoBoxUploading]}>
              <View style={styles.videoFilenameRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.videoFilenameText} numberOfLines={1}>
                  {videoFileName ?? 'video'} — uploading…
                </Text>
              </View>
            </View>
          ) : uploadedUrl ? (
            <View style={[styles.videoBox, styles.videoBoxFilled]}>
              <View style={styles.videoFilenameRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.positive} />
                <Text style={styles.videoFilenameText} numberOfLines={1}>
                  {videoFileName ?? 'video'} — uploaded
                </Text>
                <TouchableOpacity
                  onPress={handleRemoveVideo}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.videoBox, styles.videoBoxEmpty, videoError ? styles.videoBoxError : null]}>
                <MaterialCommunityIcons
                  name="video-outline"
                  size={32}
                  color={videoError ? colors.negative : colors.primary}
                />
                <TouchableOpacity onPress={handlePickVideo} style={styles.videoSelectButton} activeOpacity={0.7}>
                  <Text style={[styles.videoSelectButtonText, videoError ? styles.videoSelectButtonTextError : null]}>
                    Select Video
                  </Text>
                </TouchableOpacity>
              </View>
              {videoError && <Text style={styles.videoErrorText}>{videoError}</Text>}
            </>
          )}
        </View>

        {/* Steps */}
        {steps.map((step, index) => (
          <StepEditor
            key={step.id}
            step={step}
            stepNumber={index + 1}
            onUpdate={(updated) => handleUpdateStep(step.id, updated)}
            onDelete={() => handleDeleteStep(step.id)}
            canDelete={steps.length > 1}
            errors={stepErrors[step.id]}
          />
        ))}

        <TouchableOpacity style={styles.addStepButton} onPress={handleAddStep} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addStepText}>Add Step</Text>
        </TouchableOpacity>

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
          <Text style={styles.nextButtonText}>Next: Review</Text>
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
  videoSection: {
    marginBottom: spacing['2xl'],
  },
  videoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  videoLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  requiredStar: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.negative,
  },
  videoBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.lg,
  },
  videoBoxEmpty: {
    borderStyle: 'dashed',
    borderColor: colors.outline,
    alignItems: 'center',
    gap: spacing.sm,
  },
  videoBoxFilled: {
    borderStyle: 'solid',
    borderColor: colors.positive,
  },
  videoBoxUploading: {
    borderStyle: 'solid',
    borderColor: colors.primary,
  },
  videoBoxError: {
    borderColor: colors.negative,
  },
  videoSelectButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  videoSelectButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  videoSelectButtonTextError: {
    color: colors.negative,
  },
  videoFilenameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  videoFilenameText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  videoErrorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginTop: spacing.xs,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  addStepText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
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
