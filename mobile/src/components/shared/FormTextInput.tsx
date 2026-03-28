import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface FormTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  optional?: boolean;
  error?: string;
  inputFont?: 'sans' | 'serif';
  inputFontSize?: number;
}

export function FormTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  optional = false,
  error,
  inputFont = 'sans',
  inputFontSize = fontSizes.lg,
}: FormTextInputProps) {
  const inputFontFamily = inputFont === 'serif' ? fonts.serif : fonts.sans;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optional}>optional</Text>}
      </View>
      <TextInput
        style={[
          styles.input,
          { fontFamily: inputFontFamily, fontSize: inputFontSize },
          multiline && { minHeight: numberOfLines * 24, textAlignVertical: 'top' },
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing['2xl'],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optional: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.outline,
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.onSurface,
  },
  inputError: {
    borderColor: colors.negative,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginTop: spacing.xs,
  },
});
