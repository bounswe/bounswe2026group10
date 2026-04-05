import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  searchDishVarieties,
  fetchSearchGenres,
  searchRecipesWithFilters,
  type DishVarietyResult,
  type Recipe,
  type SortOption,
} from '../api/search';
import type { DishGenre } from '../api/dish-genres';
import { SearchBar } from '../components/search/SearchBar';
import { GenreBentoGrid } from '../components/search/GenreBentoGrid';
import { DishVarietyCard } from '../components/search/DishVarietyCard';
import { RecipeCard } from '../components/search/RecipeCard';
import { SortRow } from '../components/search/SortRow';
import { FilterModal, type FilterState, EMPTY_FILTERS } from '../components/search/FilterModal';
import { SearchResultsSheet, type SheetSection } from '../components/search/SearchResultsSheet';
import { colors, fonts, fontSizes, spacing } from '../theme';

// How many items to preview per section before the "See All" box
const PREVIEW_COUNT = 3;

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [allGenres, setAllGenres] = useState<DishGenre[]>([]);
  const [allVarieties, setAllVarieties] = useState<DishVarietyResult[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  // Active-search results
  const [matchedGenres, setMatchedGenres] = useState<DishGenre[]>([]);
  const [varieties, setVarieties] = useState<DishVarietyResult[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>('rating');
  const [loading, setLoading] = useState(false);
  const [defaultLoading, setDefaultLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Sheet state
  const [sheetSection, setSheetSection] = useState<SheetSection>('genres');
  const [sheetVisible, setSheetVisible] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchActive = query.trim().length > 0;
  const hasFilters =
    filters.excludeAllergenIds.length > 0 ||
    filters.dietaryTagIds.length > 0;

  // ── Load default state (all genres + varieties + recipes) ──────────────────
  useEffect(() => {
    setDefaultLoading(true);
    Promise.all([
      fetchSearchGenres(),
      searchDishVarieties(''),
      searchRecipesWithFilters('', {}),
    ])
      .then(([genres, vars, recs]) => {
        setAllGenres(genres);
        setAllVarieties(vars);
        setAllRecipes(recs);
      })
      .finally(() => setDefaultLoading(false));
  }, []);

  // ── Active search ──────────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (q: string, activeSort: SortOption, activeFilters: FilterState) => {
      setLoading(true);
      try {
        const exactGenre = allGenres.find(
          (g) => g.name.toLowerCase() === q.trim().toLowerCase()
        );

        const hasRecipeLevelFilters =
          activeFilters.excludeAllergenIds.length > 0 ||
          activeFilters.dietaryTagIds.length > 0;

        // Always fetch genres and recipes in parallel
        const [genreResults, recipeResults] = await Promise.all([
          fetchSearchGenres(q),
          searchRecipesWithFilters(exactGenre ? '' : q, {
            excludeAllergenIds: activeFilters.excludeAllergenIds,
            dietaryTagIds: activeFilters.dietaryTagIds,
            genreId: exactGenre?.id,
          }),
        ]);

        setMatchedGenres(genreResults);
        setRecipes(recipeResults);

        if (hasRecipeLevelFilters) {
          // Build varieties from recipe results when diet/allergen filter is active
          const varietyMap = new Map<number, DishVarietyResult>();
          for (const r of recipeResults) {
            if (!varietyMap.has(r.dishVarietyId)) {
              varietyMap.set(r.dishVarietyId, {
                id: r.dishVarietyId,
                name: r.varietyName,
                description: null,
                genreId: exactGenre?.id ?? 0,
                genreName: null,
              });
            }
          }
          setVarieties(sortVarieties(Array.from(varietyMap.values()), activeSort));
        } else {
          // Direct variety search
          const varietyResults = exactGenre
            ? await searchDishVarieties('', exactGenre.id)
            : await searchDishVarieties(q);

          // Filters only apply to recipes, not varieties
          setVarieties(sortVarieties(varietyResults, activeSort));
        }
      } catch {
        setMatchedGenres([]);
        setVarieties([]);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    },
    [allGenres]
  );

  useEffect(() => {
    if (!isSearchActive) {
      setMatchedGenres([]);
      setVarieties([]);
      setRecipes([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query, sort, filters), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sort, filters, isSearchActive, runSearch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGenrePress = (genre: DishGenre) => {
    setQuery(genre.name);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    if (isSearchActive) {
      setVarieties((prev) => sortVarieties([...prev], newSort));
    }
  };

  const handleClear = () => {
    setQuery('');
    setMatchedGenres([]);
    setVarieties([]);
    setRecipes([]);
    setFilters(EMPTY_FILTERS);
  };

  const openSheet = (section: SheetSection) => {
    setSheetSection(section);
    setSheetVisible(true);
  };

  // Current data depending on mode
  const activeGenres = isSearchActive ? matchedGenres : allGenres;
  const activeVarieties = isSearchActive ? varieties : allVarieties;
  const activeRecipes = isSearchActive ? recipes : allRecipes;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Filter modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
        appliedFilters={filters}
      />

      {/* Results sheet */}
      <SearchResultsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        section={sheetSection}
        query={query}
        genres={activeGenres}
        varieties={activeVarieties}
        recipes={activeRecipes}
        onGenrePress={handleGenrePress}
      />

      {/* ── Search bar ── */}
      <View style={styles.searchBarContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={handleClear}
          onFilterPress={() => setFilterModalVisible(true)}
        />
        {hasFilters && (
          <TouchableOpacity
            style={styles.filterBadge}
            onPress={() => setFilterModalVisible(true)}
          >
            <View style={styles.filterBadgeContent}>
              {filters.excludeAllergenNames.map((name) => (
                <View key={name} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{name}</Text>
                </View>
              ))}
              {filters.dietaryTagNames.map((name) => (
                <View key={name} style={styles.filterTag}>
                  <Text style={styles.filterTagText}>{name}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Sort row — only in active search */}
          {isSearchActive && (
            <SortRow activeSort={sort} onSortChange={handleSortChange} />
          )}

          {loading || defaultLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              {/* ── Genres section ── */}
              <SectionBox
                title="Genres"
                count={activeGenres.length}
                query={isSearchActive ? query : undefined}
                onSeeAll={() => openSheet('genres')}
              >
                {isSearchActive ? (
                  /* Search mode: show genre chips as preview */
                  activeGenres.length === 0 ? null : (
                    <View style={styles.genreChips}>
                      {activeGenres.slice(0, PREVIEW_COUNT).map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={styles.genreChip}
                          onPress={() => handleGenrePress(g)}
                        >
                          <Text style={styles.genreChipText}>{g.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )
                ) : (
                  /* Default mode: full bento grid (always visible, tap to search) */
                  <GenreBentoGrid genres={allGenres} onGenrePress={handleGenrePress} />
                )}
              </SectionBox>

              {/* ── Varieties section ── */}
              <SectionBox
                title="Varieties"
                count={activeVarieties.length}
                query={isSearchActive ? query : undefined}
                onSeeAll={() => openSheet('varieties')}
              >
                {activeVarieties.slice(0, PREVIEW_COUNT).map((v) => (
                  <DishVarietyCard key={v.id} variety={v} />
                ))}
              </SectionBox>

              {/* ── Recipes section ── */}
              <SectionBox
                title="Recipes"
                count={activeRecipes.length}
                query={isSearchActive ? query : undefined}
                onSeeAll={() => openSheet('recipes')}
              >
                {activeRecipes.slice(0, PREVIEW_COUNT).map((r) => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
              </SectionBox>
            </>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── SectionBox ───────────────────────────────────────────────────────────────

interface SectionBoxProps {
  title: string;
  count: number;
  query?: string;
  onSeeAll: () => void;
  children: React.ReactNode;
}

function SectionBox({ title, count, query, onSeeAll, children }: SectionBoxProps) {
  const heading = query
    ? `${count} ${title} for "${query}"`
    : title;

  return (
    <TouchableOpacity
      style={styles.sectionBox}
      onPress={onSeeAll}
      activeOpacity={0.92}
    >
      <View style={styles.sectionBoxHeader}>
        <Text style={styles.sectionBoxTitle}>{heading}</Text>
        <View style={styles.seeAllRow}>
          <Text style={styles.seeAllText}>See All</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.primary}
          />
        </View>
      </View>

      {/* Preview items — not interactive themselves (outer box handles tap) */}
      <View style={styles.previewItems}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortVarieties(items: DishVarietyResult[], sort: SortOption): DishVarietyResult[] {
  // For varieties, we only support sorting by name (default)
  // Filters are only applied to recipes
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  filterBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filterBadgeContent: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  filterTag: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
  },
  filterTagText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.white,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  loader: {
    marginTop: spacing['3xl'],
  },
  // ── Section Box ──────────────────────────────────────────────────────────
  sectionBox: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  sectionBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionBoxTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    flex: 1,
    flexWrap: 'wrap',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  // ── Genre chips (search mode preview) ────────────────────────────────────
  genreChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  genreChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  previewItems: {
    pointerEvents: 'none' as const,
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});
