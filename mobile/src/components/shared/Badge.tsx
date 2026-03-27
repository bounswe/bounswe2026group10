import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, fontSizes, spacing } from '../../theme';

interface BadgeProps {
  label: string;
  backgroundColor: string;
  textColor?: string;
}

export function Badge({ label, backgroundColor, textColor = '#ffffff' }: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
});
