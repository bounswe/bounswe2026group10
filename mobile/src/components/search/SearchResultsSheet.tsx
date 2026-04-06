import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DishGenre } from '../../api/dish-genres';
import type { DishVarietyResult, Recipe } from '../../api/search';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { DishVarietyCard } from './DishVarietyCard';
import { RecipeCard } from './RecipeCard';

export type SheetSection = 'genres' | 'varieties' | 'recipes';

interface SearchResultsSheetProps {
  visible: boolean;
  onClose: () => void;
  section: SheetSection;
  query: string;
  genres: DishGenre[];
  varieties: DishVarietyResult[];
  recipes: Recipe[];
  onGenrePress: (genre: DishGenre) => void;
  onVarietyPress: (variety: DishVarietyResult) => void;
}

const SECTION_LABELS: Record<SheetSection, string> = {
  genres: 'Genres',
  varieties: 'Varieties',
  recipes: 'Recipes',
};

export function SearchResultsSheet({
  visible,
  onClose,
  section,
  query,
  genres,
  varieties,
  recipes,
  onGenrePress,
  onVarietyPress,
}: SearchResultsSheetProps) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isSearchActive = query.trim().length > 0;
  const label = SECTION_LABELS[section];

  const count =
    section === 'genres'
      ? genres.length
      : section === 'varieties'
      ? varieties.length
      : recipes.length;

  const heading = isSearchActive
    ? `${count} ${label} for "${query}"`
    : label;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.5}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.onSurface}
            />
          </TouchableOpacity>
          <Text style={styles.heading} numberOfLines={1}>
            {heading}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {section === 'genres' && (
            <>
              {genres.length === 0 ? (
                <EmptyState label={label} />
              ) : (
                genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={styles.genreRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      onGenrePress(genre);
                      onClose();
                    }}
                  >
                    <Text style={styles.genreRowName}>{genre.name}</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {section === 'varieties' && (
            <>
              {varieties.length === 0 ? (
                <EmptyState label={label} />
              ) : (
                varieties.map((v) => (
                  <DishVarietyCard key={v.id} variety={v} onPress={() => onVarietyPress(v)} />
                ))
              )}
            </>
          )}

          {section === 'recipes' && (
            <>
              {recipes.length === 0 ? (
                <EmptyState label={label} />
              ) : (
                recipes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    onPress={() => {
                      onClose();
                      navigation.navigate('RecipeDetail', { recipeId: r.id });
                    }}
                  />
                ))
              )}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="magnify-remove-outline"
        size={48}
        color={colors.outline}
      />
      <Text style={styles.emptyTitle}>No {label} found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    gap: spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  heading: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  genreRowName: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});
