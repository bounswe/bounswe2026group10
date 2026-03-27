import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface CookingModeButtonProps {
  onPress?: () => void;
}

export function CookingModeButton({ onPress }: CookingModeButtonProps) {
  const handlePress = onPress ?? (() => Alert.alert('Cooking Mode', 'Coming soon'));

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.8}>
      <MaterialCommunityIcons name="chef-hat" size={20} color={colors.white} />
      <Text style={styles.label}>Start Cooking Mode</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    marginTop: spacing['2xl'],
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
});
