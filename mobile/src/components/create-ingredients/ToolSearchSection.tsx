import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Tool } from '../../types/ingredient';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { SAMPLE_TOOLS, QUICK_ADD_TOOLS } from '../../constants/ingredientsAndTools';

interface ToolSearchSectionProps {
  selectedTools: Tool[];
  onAddTool: (tool: Tool) => void;
  onRemoveTool: (toolId: string) => void;
}

export function ToolSearchSection({
  selectedTools,
  onAddTool,
  onRemoveTool,
}: ToolSearchSectionProps) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filtered = search.length > 0
    ? SAMPLE_TOOLS.filter((t) =>
        t.label.toLowerCase().includes(search.toLowerCase()) &&
        !selectedTools.some((s) => s.id === t.value),
      ).slice(0, 5)
    : [];

  const handleSelectTool = (item: { label: string; value: string }) => {
    onAddTool({ id: item.value, name: item.label });
    setSearch('');
    setShowResults(false);
  };

  const handleToggleQuickAdd = (value: string) => {
    const existing = selectedTools.find((t) => t.id === value);
    if (existing) {
      onRemoveTool(value);
    } else {
      const tool = SAMPLE_TOOLS.find((t) => t.value === value);
      if (tool) {
        onAddTool({ id: tool.value, name: tool.label });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setShowResults(text.length > 0);
          }}
          placeholder="Add a tool (e.g. Cast Iron Pan)"
          placeholderTextColor={colors.outline}
          onFocus={() => {
            if (search.length > 0) setShowResults(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowResults(false), 200);
          }}
        />
      </View>

      {showResults && filtered.length > 0 && (
        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.resultItem}
              onPress={() => handleSelectTool(item)}
            >
              <Text style={styles.resultText}>{item.label}</Text>
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.quickAddLabel}>QUICK ADD TOOLS</Text>
      <View style={styles.chips}>
        {QUICK_ADD_TOOLS.map((value) => {
          const tool = SAMPLE_TOOLS.find((t) => t.value === value);
          if (!tool) return null;
          const isSelected = selectedTools.some((t) => t.id === value);
          return (
            <TouchableOpacity
              key={value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => handleToggleQuickAdd(value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedTools.length > 0 && (
        <View style={styles.selectedList}>
          {selectedTools
            .filter((t) => !QUICK_ADD_TOOLS.includes(t.id))
            .map((tool) => (
              <View key={tool.id} style={styles.selectedRow}>
                <MaterialCommunityIcons
                  name="silverware-fork-knife"
                  size={18}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.selectedName}>{tool.name}</Text>
                <TouchableOpacity onPress={() => onRemoveTool(tool.id)}>
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  results: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
    marginTop: spacing.xs,
    maxHeight: 160,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  quickAddLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  chipTextSelected: {
    color: colors.white,
  },
  selectedList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectedName: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
});
