import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

interface IconButtonProps {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  size?: number;
  color?: string;
  onPress?: () => void;
}

export function IconButton({
  name,
  size = 24,
  color = colors.onSurface,
  onPress,
}: IconButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.6}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
  },
});
