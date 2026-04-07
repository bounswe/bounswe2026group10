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
import { useTranslation } from 'react-i18next';
import { FormTextInput } from '../shared/FormTextInput';
import { colors, fonts, fontSizes, spacing } from '../../theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export interface StepFormItem {
  id: string;
  description: string;
  timestamp: string; // MM:SS format, e.g. "01:30"
  isExpanded: boolean;
}

export interface StepFormItemErrors {
  description?: string;
  timestamp?: string;
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
  const { t } = useTranslation('common');
  const hasErrors = !!(errors?.description || errors?.timestamp);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onUpdate({ ...step, isExpanded: !step.isExpanded });
  };

  const previewText = step.description.trim()
    ? step.description.substring(0, 40) + (step.description.length > 40 ? '…' : '')
    : t('create.instructions.noDescription');

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

        {!step.isExpanded && !!step.timestamp && (
          <Text style={styles.collapsedTimestamp}>{step.timestamp}</Text>
        )}

        {step.isExpanded && <View style={styles.headerSpacer} />}

        <View style={styles.headerActions}>
          {step.isExpanded && canDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
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
            label={t('create.instructions.descriptionLabel')}
            value={step.description}
            onChangeText={(text) => onUpdate({ ...step, description: text })}
            placeholder={t('create.instructions.descriptionPlaceholder')}
            multiline
            numberOfLines={4}
            error={errors?.description}
          />

          <FormTextInput
            label={t('create.instructions.timestampLabel')}
            value={step.timestamp}
            onChangeText={(text) => onUpdate({ ...step, timestamp: text })}
            placeholder={t('create.instructions.timestampPlaceholder')}
            optional
            error={errors?.timestamp}
          />
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
  collapsedTimestamp: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginRight: spacing.sm,
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
});
