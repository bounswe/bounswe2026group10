import React from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FormTextInput } from '../shared/FormTextInput';
import { colors, fonts, fontSizes, spacing } from '../../theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export interface StepFormItem {
  id: string;
  title: string;
  description: string;
  videoUri: string | null;
  videoFileName: string | null;
  isExpanded: boolean;
}

export interface StepFormItemErrors {
  description?: string;
  video?: string;
}

interface StepEditorProps {
  step: StepFormItem;
  stepNumber: number;
  onUpdate: (updated: StepFormItem) => void;
  onDelete: () => void;
  canDelete: boolean;
  errors?: StepFormItemErrors;
}

export function StepEditor({
  step,
  stepNumber,
  onUpdate,
  onDelete,
  canDelete,
  errors,
}: StepEditorProps) {
  const hasErrors = !!(errors?.description || errors?.video);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onUpdate({ ...step, isExpanded: !step.isExpanded });
  };

  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'] as ImagePicker.MediaType[],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      onUpdate({
        ...step,
        videoUri: asset.uri,
        videoFileName: asset.fileName ?? asset.uri.split('/').pop() ?? 'video.mp4',
      });
    }
  };

  const handleRemoveVideo = () => {
    onUpdate({ ...step, videoUri: null, videoFileName: null });
  };

  const previewText = step.description.trim()
    ? step.description.length > 40
      ? step.description.substring(0, 40) + '…'
      : step.description
    : 'No description yet';

  return (
    <View style={styles.card}>
      {/* Header row — always visible */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.headerRow}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepCircleText}>{stepNumber}</Text>
          {hasErrors && !step.isExpanded && <View style={styles.errorDot} />}
        </View>

        {!step.isExpanded && (
          <Text style={styles.collapsedPreview} numberOfLines={1}>
            {previewText}
          </Text>
        )}

        {step.isExpanded && <View style={styles.headerSpacer} />}

        <View style={styles.headerActions}>
          {step.isExpanded && canDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.negative} />
            </TouchableOpacity>
          )}
          <MaterialCommunityIcons
            name={step.isExpanded ? 'chevron-down' : 'chevron-right'}
            size={22}
            color={colors.onSurfaceVariant}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded body */}
      {step.isExpanded && (
        <View style={styles.expandedBody}>
          <FormTextInput
            label="STEP TITLE"
            value={step.title}
            onChangeText={(text) => onUpdate({ ...step, title: text })}
            placeholder="e.g. Prepare the dough"
            optional
          />

          <FormTextInput
            label="DESCRIPTION"
            value={step.description}
            onChangeText={(text) => onUpdate({ ...step, description: text })}
            placeholder="Describe what to do in this step…"
            multiline
            numberOfLines={4}
            error={errors?.description}
          />

          {/* Video section */}
          <View style={styles.videoSection}>
            <View style={styles.videoLabelRow}>
              <Text style={styles.videoLabel}>VIDEO</Text>
              <Text style={styles.requiredStar}> *</Text>
            </View>

            {step.videoUri ? (
              <View style={[styles.videoBox, styles.videoBoxFilled]}>
                <View style={styles.videoFilenameRow}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.positive} />
                  <Text style={styles.videoFilenameText} numberOfLines={1}>
                    {step.videoFileName ?? 'video.mp4'}
                  </Text>
                  <TouchableOpacity onPress={handleRemoveVideo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.videoBox,
                    styles.videoBoxEmpty,
                    errors?.video ? styles.videoBoxError : null,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="video-outline"
                    size={32}
                    color={errors?.video ? colors.negative : colors.primary}
                  />
                  <TouchableOpacity onPress={handlePickVideo} style={styles.videoSelectButton} activeOpacity={0.7}>
                    <Text style={[styles.videoSelectButtonText, errors?.video ? styles.videoSelectButtonTextError : null]}>
                      Select Video
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors?.video && (
                  <Text style={styles.videoErrorText}>{errors.video}</Text>
                )}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  errorDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.negative,
    borderWidth: 1,
    borderColor: colors.white,
  },
  collapsedPreview: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontFamily: fonts.serif,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  headerSpacer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  expandedBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  videoSection: {
    marginTop: spacing.md,
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
    letterSpacing: 0.5,
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
});
