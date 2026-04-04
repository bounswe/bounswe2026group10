import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchCommunityPicks,
  fetchGenres,
  type DishGenre,
  type RecipeListItem,
} from '../api/home';
import { HomeSectionHeader } from '../components/home/HomeSectionHeader';
import { CommunityPickCard } from '../components/home/CommunityPickCard';
import { GenreCard } from '../components/home/GenreCard';
import { colors, fonts, fontSizes, spacing } from '../theme';

export function HomeScreen() {
  const [communityPicks, setCommunityPicks] = useState<RecipeListItem[]>([]);
  const [genres, setGenres] = useState<DishGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [picksRes, genresRes] = await Promise.all([
        fetchCommunityPicks(),
        fetchGenres(),
      ]);
      setCommunityPicks(picksRes.recipes);
      setGenres(genresRes);
    } catch {
      // Data stays empty — sections will show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Discover</Text>
          <Text style={styles.subtitle}>Heritage recipes from around the world</Text>
        </View>

        {/* Community Picks */}
        <View style={styles.section}>
          <HomeSectionHeader title="Community Picks" />
          {communityPicks.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {communityPicks.map((item) => (
                <CommunityPickCard key={item.id} recipe={item} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No recipes yet — check back soon!</Text>
            </View>
          )}
        </View>

        {/* Browse by Genre */}
        <View style={styles.section}>
          <HomeSectionHeader title="Browse by Genre" />
          {genres.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {genres.map((item) => (
                <GenreCard key={item.id} id={item.id} name={item.name} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No genres available</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  greeting: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['3xl'],
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
  },
  emptySection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});
