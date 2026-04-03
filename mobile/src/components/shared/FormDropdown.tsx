import React, { useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface DropdownOption {
  label: string;
  value: string;
}

interface FormDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  error?: string;
  searchable?: boolean;
}

export function FormDropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select…',
  optional = false,
  error,
  searchable = false,
}: FormDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchable && search.length > 0
    ? options.filter((o) => o.label.toLowerCase().startsWith(search.toLowerCase()))
    : options;

  const handleSelect = (option: DropdownOption) => {
    onSelect(option.value);
    setSearch('');
    setOpen(false);
  };

  const handleOpen = () => {
    setSearch('');
    setOpen(true);
  };

  const handleClose = () => {
    setSearch('');
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optional}>optional</Text>}
      </View>

      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.triggerText, !selectedOption && styles.placeholder]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View
            style={styles.modal}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>{label}</Text>

            {searchable && (
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={18}
                  color={colors.onSurfaceVariant}
                />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  placeholderTextColor={colors.outline}
                  autoFocus
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={16}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {filteredOptions.length === 0 ? (
              <Text style={styles.emptyText}>No results found</Text>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      item.value === value && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        item.value === value && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.value === value && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  triggerError: {
    borderColor: colors.negative,
  },
  triggerText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    flex: 1,
  },
  placeholder: {
    color: colors.outline,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 10,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.surfaceContainer,
  },
  optionText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  optionTextSelected: {
    fontFamily: fonts.sansMedium,
    color: colors.primary,
  },
});
