import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFilterPress: () => void;
}

export function SearchBar({ value, onChangeText, onClear, onFilterPress }: SearchBarProps) {
  const { t } = useTranslation('common');
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={styles.input}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.onSurfaceVariant}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={onFilterPress} style={styles.filterButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="tune-variant" size={22} color={colors.onSurface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
