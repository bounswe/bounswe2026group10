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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  fetchCommunityPicks,
  fetchGenres,
  type DishGenre,
  type RecipeListItem,
} from '../api/home';
import { HomeSectionHeader } from '../components/home/HomeSectionHeader';
import { CommunityPickCard } from '../components/home/CommunityPickCard';
import { GenreCard } from '../components/home/GenreCard';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { authState } = useAuth();
  const { t } = useTranslation('common');
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

  const greeting =
    authState.status === 'authenticated'
      ? t('home.hi', { username: authState.user.username })
      : t('home.discover');

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
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>

        {/* Community Picks */}
        <View style={styles.section}>
          <HomeSectionHeader title={t('home.communityPicks')} />
          {communityPicks.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {communityPicks.map((item) => (
                <CommunityPickCard
                  key={item.id}
                  recipe={item}
                  onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>{t('home.noRecipes')}</Text>
            </View>
          )}
        </View>

        {/* Browse by Genre */}
        <View style={styles.section}>
          <HomeSectionHeader title={t('home.browseByGenre')} />
          {genres.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {genres.map((item) => (
                <GenreCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  onPress={() =>
                    navigation.navigate('SearchTab', {
                      screen: 'Search',
                      params: { initialQuery: item.name },
                    })
                  }
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>{t('home.noGenres')}</Text>
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
