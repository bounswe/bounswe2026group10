import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SearchStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  searchDishVarieties,
  fetchSearchGenres,
  fetchDiscoveryRecipes,
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
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../theme';

// How many items to preview per section before the "See All" box
const PREVIEW_COUNT = 3;

type NavigationProp = NativeStackNavigationProp<any>;

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<SearchStackParamList, 'Search'>>();
  const { t } = useTranslation('common');

  // ── Search text ────────────────────────────────────────────────────────────
  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(route.params?.initialQuery ?? '');

  // ── Genre selection (drives genreId filter on recipe API) ──────────────────
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  // ── Base data (loaded once on mount) ──────────────────────────────────────
  const [allGenres, setAllGenres] = useState<DishGenre[]>([]);
  const [allVarieties, setAllVarieties] = useState<DishVarietyResult[]>([]);

  // ── Recipes (fetched on every filter/search/genre change) ─────────────────
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // ── Filters & sort ────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>('rating');

  // ── Loading states ────────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sheetSection, setSheetSection] = useState<SheetSection>('genres');
  const [sheetVisible, setSheetVisible] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const isSearchActive = query.trim().length > 0 || selectedGenreId !== null;
  const hasFilters =
    filters.excludeAllergenIds.length > 0 ||
    filters.dietaryTagIds.length > 0 ||
    filters.country !== '' ||
    filters.city !== '';

  // Client-side filtered genres (by search text)
  const filteredGenres = useMemo(() => {
    if (!normalizedSearch) return allGenres;
    return allGenres.filter((g) => g.name.toLowerCase().includes(normalizedSearch));
  }, [allGenres, normalizedSearch]);

  // Client-side filtered varieties (by selected genre + search text)
  const filteredVarieties = useMemo(() => {
    let result = allVarieties;
    if (selectedGenreId !== null) {
      result = result.filter((v) => v.genreId === selectedGenreId);
    }
    if (normalizedSearch) {
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(normalizedSearch) ||
          v.genreName?.toLowerCase().includes(normalizedSearch)
      );
    }
    return sortVarieties(result, sort);
  }, [allVarieties, selectedGenreId, normalizedSearch, sort]);

  // ── Load genres + varieties once on mount ─────────────────────────────────
  useEffect(() => {
    setInitialLoading(true);
    Promise.all([fetchSearchGenres(), searchDishVarieties('')])
      .then(([genres, vars]) => {
        setAllGenres(genres);
        setAllVarieties(vars);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  // ── Debounce search input ─────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Fetch recipes on search / genre / filter change ───────────────────────
  useEffect(() => {
    setRecipesLoading(true);
    fetchDiscoveryRecipes({
      search: debouncedSearch.trim() || undefined,
      genreId: selectedGenreId ?? undefined,
      excludeAllergenIds: filters.excludeAllergenIds,
      dietaryTagIds: filters.dietaryTagIds,
      country: filters.country || undefined,
      city: filters.city || undefined,
    })
      .then(setRecipes)
      .finally(() => setRecipesLoading(false));
  }, [debouncedSearch, selectedGenreId, filters]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGenrePress = useCallback((genre: DishGenre) => {
    setSelectedGenreId((prev) => (prev === genre.id ? null : genre.id));
    setQuery('');
    setDebouncedSearch('');
  }, []);

  const handleVarietyPress = (variety: DishVarietyResult) => {
    navigation.navigate('DishVarietyDetail', { id: variety.id });
    setSheetVisible(false);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedSearch('');
    setSelectedGenreId(null);
    setFilters(EMPTY_FILTERS);
  };

  const openSheet = (section: SheetSection) => {
    setSheetSection(section);
    setSheetVisible(true);
  };

  const loading = initialLoading || recipesLoading;

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
        genres={filteredGenres}
        varieties={filteredVarieties}
        recipes={recipes}
        onGenrePress={handleGenrePress}
        onVarietyPress={handleVarietyPress}
      />

      {/* ── Search bar ── */}
      <View style={styles.searchBarContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={handleClear}
          onFilterPress={() => setFilterModalVisible(true)}
        />
        {(hasFilters || selectedGenreId !== null) && (
          <TouchableOpacity
            style={styles.filterBadge}
            onPress={() => setFilterModalVisible(true)}
          >
            <View style={styles.filterBadgeContent}>
              {selectedGenreId !== null && (
                <View style={styles.filterTag}>
                  <Text style={styles.filterTagText}>
                    {allGenres.find((g) => g.id === selectedGenreId)?.name ?? ''}
                  </Text>
                </View>
              )}
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
              {filters.country !== '' && (
                <View style={styles.filterTag}>
                  <Text style={styles.filterTagText}>
                    {filters.city ? `${filters.city}, ${filters.country}` : filters.country}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Sort row — only when search or genre filter is active */}
          {isSearchActive && (
            <SortRow activeSort={sort} onSortChange={handleSortChange} />
          )}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              {/* ── Genres section ── */}
              <SectionBox
                title={t('search.genres')}
                count={filteredGenres.length}
                query={isSearchActive ? query || undefined : undefined}
                onSeeAll={() => openSheet('genres')}
              >
                {isSearchActive ? (
                  filteredGenres.length === 0 ? null : (
                    <View style={styles.genreChips}>
                      {filteredGenres.slice(0, PREVIEW_COUNT).map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.genreChip,
                            selectedGenreId === g.id && styles.genreChipActive,
                          ]}
                          onPress={() => handleGenrePress(g)}
                        >
                          <Text style={styles.genreChipText}>{g.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )
                ) : (
                  <GenreBentoGrid
                    genres={allGenres}
                    onGenrePress={handleGenrePress}
                    activeGenreId={selectedGenreId}
                  />
                )}
              </SectionBox>

              {/* ── Varieties section ── */}
              <SectionBox
                title={t('search.varieties')}
                count={filteredVarieties.length}
                query={isSearchActive ? query || undefined : undefined}
                onSeeAll={() => openSheet('varieties')}
              >
                {filteredVarieties.slice(0, PREVIEW_COUNT).map((v) => (
                  <DishVarietyCard
                    key={v.id}
                    variety={v}
                    onPress={() => handleVarietyPress(v)}
                  />
                ))}
              </SectionBox>

              {/* ── Recipes section ── */}
              <SectionBox
                title={t('search.recipes')}
                count={recipes.length}
                query={isSearchActive ? query || undefined : undefined}
                onSeeAll={() => openSheet('recipes')}
              >
                {recipes.slice(0, PREVIEW_COUNT).map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    onPress={() => navigation.navigate('RecipeDetail', { recipeId: r.id })}
                  />
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
  const { t } = useTranslation('common');
  const heading = query
    ? t('search.resultsFor', { count, title, query })
    : title;

  return (
    <View style={styles.sectionBox}>
      <TouchableOpacity
        style={styles.sectionBoxHeader}
        onPress={onSeeAll}
        activeOpacity={0.92}
      >
        <Text style={styles.sectionBoxTitle}>{heading}</Text>
        <View style={styles.seeAllRow}>
          <Text style={styles.seeAllText}>{t('search.seeAll')}</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>

      {/* Preview items — interactive children (varieties, recipes) */}
      <View style={styles.previewItems}>
        {children}
      </View>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortVarieties(items: DishVarietyResult[], _sort: SortOption): DishVarietyResult[] {
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
  genreChipActive: {
    backgroundColor: colors.primaryDark ?? colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  genreChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  previewItems: {
    // Allow pointer events so children (varieties, recipes) are interactive
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});
