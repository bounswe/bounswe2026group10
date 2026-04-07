import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fetchDietaryTags, fetchLocations, type DietaryTag } from '../../api/search';
import { colors, fonts, fontSizes, spacing } from '../../theme';

export interface FilterState {
  excludeAllergenIds: number[];
  excludeAllergenNames: string[];
  dietaryTagIds: number[];
  dietaryTagNames: string[];
  country: string;
  city: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  /** Current applied filters — used to sync internal state (e.g. after external clear) */
  appliedFilters?: FilterState;
}

export const EMPTY_FILTERS: FilterState = {
  excludeAllergenIds: [],
  excludeAllergenNames: [],
  dietaryTagIds: [],
  dietaryTagNames: [],
  country: '',
  city: '',
};

export function FilterModal({ visible, onClose, onApply, onClear, appliedFilters }: FilterModalProps) {
  const { t } = useTranslation('common');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    allergens: false,
    dietary: false,
    location: false,
  });
  const [tags, setTags] = useState<DietaryTag[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Sync internal state when appliedFilters changes (e.g. after external clear)
  useEffect(() => {
    setFilters(appliedFilters ?? EMPTY_FILTERS);
  }, [appliedFilters]);

  // Load dietary tags + countries when modal opens
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([fetchDietaryTags(), fetchLocations()])
      .then(([tagData, countryData]) => {
        setTags(tagData);
        setCountries(countryData);
      })
      .finally(() => setLoading(false));
  }, [visible]);

  // Load cities when selected country changes
  useEffect(() => {
    if (!filters.country) {
      setCities([]);
      return;
    }
    fetchLocations(filters.country).then(setCities);
  }, [filters.country]);

  const allergenTags = tags.filter((t) => t.category === 'allergen');
  const dietaryTags = tags.filter((t) => t.category === 'dietary');

  const toggleAllergen = (id: number, name: string) => {
    setFilters((prev) => ({
      ...prev,
      excludeAllergenIds: prev.excludeAllergenIds.includes(id)
        ? prev.excludeAllergenIds.filter((aid) => aid !== id)
        : [...prev.excludeAllergenIds, id],
      excludeAllergenNames: prev.excludeAllergenNames.includes(name)
        ? prev.excludeAllergenNames.filter((n) => n !== name)
        : [...prev.excludeAllergenNames, name],
    }));
  };

  const toggleDietaryTag = (id: number, name: string) => {
    setFilters((prev) => ({
      ...prev,
      dietaryTagIds: prev.dietaryTagIds.includes(id)
        ? prev.dietaryTagIds.filter((tid) => tid !== id)
        : [...prev.dietaryTagIds, id],
      dietaryTagNames: prev.dietaryTagNames.includes(name)
        ? prev.dietaryTagNames.filter((n) => n !== name)
        : [...prev.dietaryTagNames, name],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    onClear();
    onClose();
  };


  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header} pointerEvents="box-none">
          <Text style={styles.title}>{t('search.filters')}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.5}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>

            {/* ── Location ── */}
            {countries.length > 0 && (
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('location')}
                >
                  <Text style={styles.filterTitle}>{t('search.location')}</Text>
                  <MaterialCommunityIcons
                    name={expandedSections.location ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>

                {expandedSections.location && (
                  <View style={styles.sectionContent}>
                    {/* Country chips */}
                    <Text style={styles.sublabel}>{t('search.country')}</Text>
                    <View style={styles.chipRow}>
                      {countries.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.chip, filters.country === c && styles.chipActive]}
                          onPress={() =>
                            setFilters((prev) => ({
                              ...prev,
                              country: prev.country === c ? '' : c,
                              city: '',
                            }))
                          }
                        >
                          <Text style={[styles.chipText, filters.country === c && styles.chipTextActive]}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* City chips — only when a country is selected */}
                    {filters.country !== '' && cities.length > 0 && (
                      <>
                        <Text style={[styles.sublabel, { marginTop: spacing.md }]}>{t('search.city')}</Text>
                        <View style={styles.chipRow}>
                          {cities.map((c) => (
                            <TouchableOpacity
                              key={c}
                              style={[styles.chip, filters.city === c && styles.chipActive]}
                              onPress={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  city: prev.city === c ? '' : c,
                                }))
                              }
                            >
                              <Text style={[styles.chipText, filters.city === c && styles.chipTextActive]}>
                                {c}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── Exclude Allergens ── */}
            {allergenTags.length > 0 && (
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('allergens')}
                >
                  <Text style={styles.filterTitle}>{t('search.allergens')}</Text>
                  <MaterialCommunityIcons
                    name={expandedSections.allergens ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>

                {expandedSections.allergens && (
                  <View style={styles.sectionContent}>
                    {allergenTags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={styles.checkboxRow}
                        onPress={() => toggleAllergen(tag.id, tag.name)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            filters.excludeAllergenIds.includes(tag.id) && styles.checkboxChecked,
                          ]}
                        >
                          {filters.excludeAllergenIds.includes(tag.id) && (
                            <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{tag.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Dietary Preferences ── */}
            {dietaryTags.length > 0 && (
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('dietary')}
                >
                  <Text style={styles.filterTitle}>{t('search.dietaryTags')}</Text>
                  <MaterialCommunityIcons
                    name={expandedSections.dietary ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>

                {expandedSections.dietary && (
                  <View style={styles.sectionContent}>
                    {dietaryTags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={styles.checkboxRow}
                        onPress={() => toggleDietaryTag(tag.id, tag.name)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            filters.dietaryTagIds.includes(tag.id) && styles.checkboxChecked,
                          ]}
                        >
                          {filters.dietaryTagIds.includes(tag.id) && (
                            <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{tag.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.spacer} />
          </ScrollView>
        )}

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleClear}>
            <Text style={styles.buttonSecondaryText}>{t('search.clearAll')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleApply}>
            <Text style={styles.buttonPrimaryText}>{t('search.applyFilters')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['2xl'],
    color: colors.onSurface,
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  filterSection: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  /** Row with title on left, chevron on right */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  filterTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  filterTitleDisabled: {
    color: colors.outline,
  },
  sectionContent: {
    paddingBottom: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    flex: 1,
  },
  spacer: {
    height: spacing['2xl'],
  },
  sublabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
  },
  chipTextActive: {
    color: colors.white,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
});
