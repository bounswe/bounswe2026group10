import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface ImportCardsProps {
  onPasteText: () => void;
}

export function ImportCards({ onPasteText }: ImportCardsProps) {
  const { t } = useTranslation('common');

  const handleVoiceRecording = () => {
    Alert.alert(t('common.comingSoon'), t('create.import.voiceComingSoon'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('create.import.title')}</Text>
      <View style={styles.cards}>
        <TouchableOpacity style={styles.card} onPress={onPasteText} activeOpacity={0.7}>
          <MaterialCommunityIcons name="text-box-outline" size={28} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('create.import.pasteText')}</Text>
          <Text style={styles.cardSubtitle}>{t('create.import.pasteTextSubtitle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleVoiceRecording} activeOpacity={0.7}>
          <MaterialCommunityIcons name="microphone-outline" size={28} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('create.import.voiceRecording')}</Text>
          <Text style={styles.cardSubtitle}>{t('create.import.voiceRecordingSubtitle')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('create.import.orFillIn')}</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing['3xl'],
  },
  sectionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
  },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  cardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outline,
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginHorizontal: spacing.md,
  },
});
