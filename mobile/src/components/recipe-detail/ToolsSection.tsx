import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Tool } from '../../types/ingredient';
import { SectionHeader } from '../shared/SectionHeader';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface ToolsSectionProps {
  tools: Tool[];
}

export function ToolsSection({ tools }: ToolsSectionProps) {
  const { t } = useTranslation('common');
  return (
    <SectionHeader title={t('recipeDetail.tools')}>
      <View>
        {tools.map((tool) => (
          <View key={tool.id} style={styles.row}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={colors.onSurfaceVariant} />
            <Text style={styles.name}>{tool.name}</Text>
          </View>
        ))}
      </View>
    </SectionHeader>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
});
