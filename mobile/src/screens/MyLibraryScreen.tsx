import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  deleteRecipe,
  getFavorites,
  getMyRecipes,
  getRecipeById,
  type FavoriteRecipe,
  type MyRecipeSummary,
} from '../api/recipes';
import { mapBackendToDraft } from '../utils/draftHelpers';
import { useRecipeForm } from '../context/RecipeFormContext';
import type { LibraryStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing } from '../theme';

type LibraryTab = 'all' | 'published' | 'draft' | 'favorites';
type SortKey = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';

const TABS: LibraryTab[] = ['all', 'published', 'draft', 'favorites'];
const SORT_OPTIONS: SortKey[] = ['date_desc', 'date_asc', 'rating_desc', 'rating_asc'];

function sortRecipes(recipes: MyRecipeSummary[], sort: SortKey): MyRecipeSummary[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'date_desc':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'date_asc':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'rating_desc':
      return sorted.sort(
        (a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1),
      );
    case 'rating_asc':
      return sorted.sort(
        (a, b) => (a.averageRating ?? Infinity) - (b.averageRating ?? Infinity),
      );
  }
}

export function MyLibraryScreen() {
  const { t } = useTranslation('common');
  const navigation =
    useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();

  const [filter, setFilter] = useState<LibraryTab>('all');
  const [sort, setSort] = useState<SortKey>('date_desc');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [allRecipes, setAllRecipes] = useState<MyRecipeSummary[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const { updateDraft } = useRecipeForm();
  const [resumingId, setResumingId] = useState<string | null>(null);

  const isFavoritesTab = filter === 'favorites';

  const load = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const [myRecipesData, favData] = await Promise.all([
          getMyRecipes(),
          getFavorites(),
        ]);
        setAllRecipes(myRecipesData);
        setFavorites(favData.recipes);
        
        if (showSpinner) {
          setSelectedCountry('');
          setSelectedCity('');
        }
      } catch {
        setError(t('library.errorRetry'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const countries = useMemo(
    () =>
      Array.from(
        new Set(allRecipes.map((r) => r.country).filter(Boolean) as string[]),
      ).sort(),
    [allRecipes],
  );

  const cities = useMemo(() => {
    const source = selectedCountry
      ? allRecipes.filter((r) => r.country === selectedCountry)
      : allRecipes;
    return Array.from(
      new Set(source.map((r) => r.city).filter(Boolean) as string[]),
    ).sort();
  }, [allRecipes, selectedCountry]);

  const displayedRecipes = useMemo(() => {
    let result = allRecipes;
    
    if (filter === 'published') {
      result = result.filter((r) => r.isPublished);
    } else if (filter === 'draft') {
      result = result.filter((r) => !r.isPublished);
    }

    if (selectedCountry)
      result = result.filter((r) => r.country === selectedCountry);
    if (selectedCity) result = result.filter((r) => r.city === selectedCity);
    return sortRecipes(result, sort);
  }, [allRecipes, filter, selectedCountry, selectedCity, sort]);

  const displayedFavorites = useMemo(
    () =>
      [...favorites].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [favorites],
  );

  const listIsEmpty = isFavoritesTab
    ? displayedFavorites.length === 0
    : displayedRecipes.length === 0;

  const hasLocationData = countries.length > 0;

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionError(null);
    setDeleteBusy(true);
    try {
      await deleteRecipe(deleteTarget.id);
      setDeleteTarget(null);
      await load(false);
    } catch {
      setActionError(t('library.deleteError'));
    } finally {
      setDeleteBusy(false);
    }
  }

  function openDeleteConfirm(recipe: MyRecipeSummary) {
    setActionError(null);
    setDeleteTarget({ id: recipe.id, title: recipe.title });
  }

  function renderFavoriteItem({ item }: { item: FavoriteRecipe }) {
    const subtitle = [item.dishVarietyName, item.genreName]
      .filter(Boolean)
      .join(' · ');
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() =>
          navigation.navigate('RecipeDetail', { recipeId: item.id })
        }
      >
        <View style={styles.thumb}>
          {item.coverImageUrl ? (
            <Image
              source={{ uri: item.coverImageUrl }}
              style={styles.thumbImage}
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons
                name="image-outline"
                size={28}
                color={colors.onSurfaceVariant}
              />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeBadge,
                item.type === 'cultural'
                  ? styles.typeCultural
                  : styles.typeCommunity,
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  item.type === 'cultural'
                    ? styles.typeCulturalText
                    : styles.typeCommunityText,
                ]}
              >
                {t(
                  item.type === 'cultural'
                    ? 'library.typeCultural'
                    : 'library.typeCommunity',
                )}
              </Text>
            </View>
            {item.averageRating !== null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={colors.starYellow} />
                <Text style={styles.ratingText}>
                  {item.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ratingCount}>({item.ratingCount})</Text>
              </View>
            )}
          </View>
          {!!subtitle && (
            <Text style={styles.locationText} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {!!item.creatorUsername && (
            <Text style={styles.locationText} numberOfLines={1}>
              {t('library.byAuthor', { name: item.creatorUsername })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderItem({ item }: { item: MyRecipeSummary }) {
    const location = [item.city, item.country].filter(Boolean).join(', ');
    const isResuming = resumingId === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        disabled={isResuming}
        onPress={async () => {
          if (!item.isPublished) {
            try {
              setResumingId(item.id);
              const detail = await getRecipeById(item.id);
              const draftState = mapBackendToDraft(detail);
              updateDraft(draftState);
              navigation.getParent()?.navigate('CreateTab' as never);
            } catch (err) {
              console.error(err);
              setActionError(t('library.errorRetry'));
            } finally {
              setResumingId(null);
            }
          } else {
            navigation.navigate('RecipeDetail', { recipeId: item.id });
          }
        }}
      >
        <View style={styles.thumb}>
          {isResuming ? (
            <View style={styles.thumbPlaceholder}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : item.coverImageUrl ? (
            <Image
              source={{ uri: item.coverImageUrl }}
              style={styles.thumbImage}
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons
                name="image-outline"
                size={28}
                color={colors.onSurfaceVariant}
              />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                item.isPublished
                  ? styles.statusPublished
                  : styles.statusDraft,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.isPublished
                    ? styles.statusPublishedText
                    : styles.statusDraftText,
                ]}
              >
                {t(
                  item.isPublished
                    ? 'library.statusPublished'
                    : 'library.statusDraft',
                )}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeBadge,
                item.type === 'cultural'
                  ? styles.typeCultural
                  : styles.typeCommunity,
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  item.type === 'cultural'
                    ? styles.typeCulturalText
                    : styles.typeCommunityText,
                ]}
              >
                {t(
                  item.type === 'cultural'
                    ? 'library.typeCultural'
                    : 'library.typeCommunity',
                )}
              </Text>
            </View>
            {item.averageRating !== null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={colors.starYellow} />
                <Text style={styles.ratingText}>
                  {item.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ratingCount}>({item.ratingCount})</Text>
              </View>
            )}
            {!!location && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={colors.onSurfaceVariant}
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => openDeleteConfirm(item)}
            >
              <Text style={styles.deleteBtnText}>{t('library.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('library.title')}</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t(`library.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!loading && !isFavoritesTab && allRecipes.length > 0 && (
        <View style={{ flexGrow: 0, flexShrink: 0, marginBottom: spacing.md }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbar}
            style={{ maxHeight: 40 }}
          >
          <TouchableOpacity
            style={styles.chip}
            onPress={() => setSortModalOpen(true)}
          >
            <Ionicons
              name="swap-vertical"
              size={14}
              color={colors.onSurface}
            />
            <Text style={styles.chipText}>{t(`library.sort${sortKeyToLabel(sort)}`)}</Text>
          </TouchableOpacity>

          {hasLocationData && (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => setCountryModalOpen(true)}
            >
              <Ionicons name="earth-outline" size={14} color={colors.onSurface} />
              <Text style={styles.chipText}>
                {selectedCountry || t('library.filterCountryAll')}
              </Text>
            </TouchableOpacity>
          )}

          {hasLocationData && cities.length > 0 && (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => setCityModalOpen(true)}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.onSurface}
              />
              <Text style={styles.chipText}>
                {selectedCity || t('library.filterCityAll')}
              </Text>
            </TouchableOpacity>
          )}
          </ScrollView>
        </View>
      )}

      {!!actionError && <Text style={styles.errorText}>{actionError}</Text>}
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>{t('library.loading')}</Text>
        </View>
      ) : listIsEmpty ? (
        <View style={styles.empty}>
          <Ionicons
            name={isFavoritesTab ? 'heart-outline' : 'book-outline'}
            size={48}
            color={colors.onSurfaceVariant}
          />
          <Text style={styles.emptyText}>
            {isFavoritesTab ? t('library.favoritesEmpty') : t('library.empty')}
          </Text>
          {!isFavoritesTab &&
            (filter !== 'all' || selectedCountry || selectedCity) && (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => {
                  setFilter('all');
                  setSelectedCountry('');
                  setSelectedCity('');
                }}
              >
                <Text style={styles.emptyActionText}>
                  {t('library.showAll')}
                </Text>
              </TouchableOpacity>
            )}
        </View>
      ) : isFavoritesTab ? (
        <FlatList
          data={displayedFavorites}
          keyExtractor={(r) => r.id}
          renderItem={renderFavoriteItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={displayedRecipes}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sort modal */}
      <SelectModal
        visible={sortModalOpen}
        title={t('library.sortLabel')}
        onClose={() => setSortModalOpen(false)}
        options={SORT_OPTIONS.map((s) => ({
          value: s,
          label: t(`library.sort${sortKeyToLabel(s)}`),
        }))}
        selected={sort}
        onSelect={(val) => {
          setSort(val as SortKey);
          setSortModalOpen(false);
        }}
      />

      {/* Country modal */}
      <SelectModal
        visible={countryModalOpen}
        title={t('library.filterCountry')}
        onClose={() => setCountryModalOpen(false)}
        options={[
          { value: '', label: t('library.filterCountryAll') },
          ...countries.map((c) => ({ value: c, label: c })),
        ]}
        selected={selectedCountry}
        onSelect={(val) => {
          setSelectedCountry(val);
          setSelectedCity('');
          setCountryModalOpen(false);
        }}
      />

      {/* City modal */}
      <SelectModal
        visible={cityModalOpen}
        title={t('library.filterCity')}
        onClose={() => setCityModalOpen(false)}
        options={[
          { value: '', label: t('library.filterCityAll') },
          ...cities.map((c) => ({ value: c, label: c })),
        ]}
        selected={selectedCity}
        onSelect={(val) => {
          setSelectedCity(val);
          setCityModalOpen(false);
        }}
      />

      {/* Delete confirmation */}
      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteBusy && setDeleteTarget(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !deleteBusy && setDeleteTarget(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {t('library.deleteConfirmTitle')}
            </Text>
            <Text style={styles.modalMessage}>
              {deleteTarget
                ? t('library.deleteConfirmMessage', {
                    title: deleteTarget.title,
                  })
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                disabled={deleteBusy}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.modalBtnCancelText}>
                  {t('library.deleteCancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDanger]}
                disabled={deleteBusy}
                onPress={confirmDelete}
              >
                {deleteBusy ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalBtnDangerText}>
                    {t('library.deleteConfirm')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function sortKeyToLabel(key: SortKey): string {
  switch (key) {
    case 'date_desc':
      return 'DateDesc';
    case 'date_asc':
      return 'DateAsc';
    case 'rating_desc':
      return 'RatingDesc';
    case 'rating_asc':
      return 'RatingAsc';
  }
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function SelectModal({
  visible,
  title,
  onClose,
  options,
  selected,
  onSelect,
}: SelectModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.selectModalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((opt) => {
              const active = opt.value === selected;
              return (
                <TouchableOpacity
                  key={opt.value || '__all__'}
                  style={[
                    styles.selectOption,
                    active && styles.selectOptionActive,
                  ]}
                  onPress={() => onSelect(opt.value)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      active && styles.selectOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.onSurface,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    fontSize: fontSizes.sm ?? 14,
    color: colors.onSurface,
    fontWeight: '600',
  },
  tabTextActive: { color: colors.white },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipText: {
    fontSize: fontSizes.sm ?? 13,
    color: colors.onSurface,
    fontWeight: '500',
  },
  errorText: {
    color: colors.negative,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.sm ?? 13,
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: {
    marginTop: spacing.md,
    color: colors.onSurfaceVariant,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    color: colors.onSurfaceVariant,
    fontSize: fontSizes.md ?? 15,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  emptyActionText: { color: colors.white, fontWeight: '600' },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.md,
  },
  thumb: { width: 110, height: 110, backgroundColor: colors.surfaceContainer },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSizes.md ?? 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPublished: { backgroundColor: '#e1f3d8' },
  statusDraft: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusPublishedText: { color: colors.positive },
  statusDraftText: { color: '#92400e' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeCultural: { backgroundColor: '#f3e8ff' },
  typeCommunity: { backgroundColor: '#dbeafe' },
  typeText: { fontSize: 11, fontWeight: '600' },
  typeCulturalText: { color: '#6b21a8' },
  typeCommunityText: { color: '#1e40af' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
  ratingCount: { fontSize: 11, color: colors.onSurfaceVariant },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  locationText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  publishBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  publishBtnText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: colors.white,
    borderColor: colors.negative,
  },
  deleteBtnText: {
    color: colors.negative,
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
  },
  selectModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.lg ?? 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: fontSizes.md ?? 14,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  modalBtnCancel: { backgroundColor: colors.surfaceContainer },
  modalBtnCancelText: { color: colors.onSurface, fontWeight: '600' },
  modalBtnDanger: { backgroundColor: colors.negative },
  modalBtnDangerText: { color: colors.white, fontWeight: '600' },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  selectOptionActive: { backgroundColor: colors.surfaceContainer },
  selectOptionText: {
    fontSize: fontSizes.md ?? 14,
    color: colors.onSurface,
  },
  selectOptionTextActive: { fontWeight: '700', color: colors.primary },
});
