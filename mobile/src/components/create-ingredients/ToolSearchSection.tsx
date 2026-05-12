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
import { useTranslation } from 'react-i18next';
import type { Tool } from '../../types/ingredient';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import type { ToolItem } from '../../api/tools';
import { searchStartsWith } from '../../utils/string';

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
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const query = search.trim();
  const filtered = query.length > 0
    ? allTools
        .filter((t) =>
          searchStartsWith(t.name, query) &&
          !selectedTools.some((s) => s.id === t.name),
        )
        .slice(0, 5)
    : [];

  const handleSelectTool = (item: ToolItem) => {
    onAddTool({ id: item.name, name: item.name });
    setSearch('');
    setShowResults(false);
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
          placeholder={t('create.tools.searchPlaceholder')}
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

      {selectedTools.length > 0 && (
        <View style={styles.selectedList}>
          {selectedTools.map((tool) => (
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
