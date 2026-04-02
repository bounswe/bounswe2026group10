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
import type { ToolItem } from '../../api/tools';

// Number of tools to show in the quick-add chips row
const QUICK_ADD_COUNT = 7;

interface ToolSearchSectionProps {
  allTools: ToolItem[]; // full list fetched once by the parent screen
  selectedTools: Tool[];
  onAddTool: (tool: Tool) => void;
  onRemoveTool: (toolId: string) => void;
}

export function ToolSearchSection({
  allTools,
  selectedTools,
  onAddTool,
  onRemoveTool,
}: ToolSearchSectionProps) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const query = search.trim().toLowerCase();
  const filtered = query.length > 0
    ? allTools
        .filter((t) =>
          t.name.toLowerCase().startsWith(query) &&
          !selectedTools.some((s) => s.id === t.name),
        )
        .slice(0, 5)
    : [];

  // First QUICK_ADD_COUNT tools from the backend list as quick-add chips
  const quickAddTools = allTools.slice(0, QUICK_ADD_COUNT);

  const handleSelectTool = (item: ToolItem) => {
    onAddTool({ id: item.name, name: item.name });
    setSearch('');
    setShowResults(false);
  };

  const handleToggleQuickAdd = (name: string) => {
    const existing = selectedTools.find((t) => t.id === name);
    if (existing) {
      onRemoveTool(name);
    } else {
      onAddTool({ id: name, name });
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
              key={item.name}
              style={styles.resultItem}
              onPress={() => handleSelectTool(item)}
            >
              <Text style={styles.resultText}>{item.name}</Text>
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {quickAddTools.length > 0 && (
        <>
          <Text style={styles.quickAddLabel}>QUICK ADD TOOLS</Text>
          <View style={styles.chips}>
            {quickAddTools.map((tool) => {
              const isSelected = selectedTools.some((t) => t.id === tool.name);
              return (
                <TouchableOpacity
                  key={tool.name}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => handleToggleQuickAdd(tool.name)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {tool.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {selectedTools.length > 0 && (
        <View style={styles.selectedList}>
          {selectedTools
            .filter((t) => !quickAddTools.some((q) => q.name === t.id))
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
