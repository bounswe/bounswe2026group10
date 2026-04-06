import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../api/client';
import { colors, fonts, fontSizes, spacing } from '../theme';
import type { ProfileStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

interface RecipeSummary {
  id: string;
  title: string;
  type: 'cultural' | 'community';
  isPublished: boolean;
  averageRating: number | null;
  coverImageUrl: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  learner: colors.secondary,
  cook: colors.tertiary,
  expert: colors.primary,
};

const ROLE_LABELS: Record<string, string> = {
  learner: 'Learner',
  cook: 'Cook',
  expert: 'Expert',
};

function StarIcon() {
  return (
    <MaterialCommunityIcons name="star" size={12} color={colors.starYellow} />
  );
}

export function ProfileScreen() {
  const { authState, logout } = useAuth();
  const navigation = useNavigation<Nav>();

  const user = authState.status === 'authenticated' ? authState.user : null;

  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchApi<RecipeSummary[]>('/recipes/mine')
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setRecipes(
            list.map((r: any) => ({
              id: String(r.id),
              title: r.title ?? '',
              type: r.type === 'cultural' ? 'cultural' : 'community',
              isPublished: r.isPublished ?? false,
              averageRating: r.averageRating ?? null,
              coverImageUrl: r.coverImageUrl ?? null,
            }))
          );
        }
      })
      .catch(() => { if (!cancelled) setRecipes([]); })
      .finally(() => { if (!cancelled) setRecipesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  const role = user?.role ?? 'learner';
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? colors.primary;

  const publishedRecipes = recipes.filter((r) => r.isPublished);
  const draftCount = recipes.filter((r) => !r.isPublished).length;
  const recentPublished = publishedRecipes.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {/* Language toggle — wired up in a later task */}
          <View style={styles.langToggle}>
            <Text style={[styles.langOption, styles.langActive]}>EN</Text>
            <Text style={styles.langSep}>|</Text>
            <Text style={styles.langOption}>TR</Text>
          </View>
        </View>

        {/* ── User card ── */}
        <View style={styles.card}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {/* Role badge — bottom-right corner of avatar */}
            <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user?.username ?? '—'}</Text>
            <Text style={styles.email}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        {!recipesLoading && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{recipes.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{publishedRecipes.length}</Text>
              <Text style={styles.statLabel}>Published</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{draftCount}</Text>
              <Text style={styles.statLabel}>Drafts</Text>
            </View>
          </View>
        )}

        {recipesLoading && (
          <ActivityIndicator
            style={styles.spinner}
            size="small"
            color={colors.primary}
          />
        )}

        {/* ── Recent published recipes ── */}
        {!recipesLoading && recentPublished.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Recipes</Text>
            {recentPublished.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
              >
                <View style={styles.recipeThumb}>
                  {recipe.coverImageUrl ? (
                    <Image
                      source={{ uri: recipe.coverImageUrl }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.recipePlaceholder} />
                  )}
                </View>
                <View style={styles.recipeBody}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  <View style={styles.recipeMeta}>
                    <View
                      style={[
                        styles.typeBadge,
                        recipe.type === 'cultural'
                          ? styles.typeCultural
                          : styles.typeCommunity,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {recipe.type === 'cultural' ? 'Cultural' : 'Community'}
                      </Text>
                    </View>
                    {recipe.averageRating !== null && (
                      <View style={styles.ratingRow}>
                        <StarIcon />
                        <Text style={styles.ratingText}>
                          {recipe.averageRating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {publishedRecipes.length > 5 && (
              <TouchableOpacity style={styles.seeAll} activeOpacity={0.7}>
                <Text style={styles.seeAllText}>
                  See all {publishedRecipes.length} recipes
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!recipesLoading && recipes.length === 0 && (
          <Text style={styles.emptyText}>
            No recipes yet. Start creating!
          </Text>
        )}

        {/* ── Sign out ── */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="logout"
            size={18}
            color={colors.negative}
          />
          <Text style={styles.signOutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 80;
const BADGE_SIZE = 28;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    gap: spacing['2xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['2xl'],
    color: colors.onSurface,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  langOption: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },
  langActive: {
    color: colors.primary,
    fontFamily: fonts.sansBold,
  },
  langSep: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.outline,
  },

  // User card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: spacing['2xl'],
    gap: spacing['2xl'],
  },
  avatarWrapper: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes['2xl'],
    color: colors.white,
  },
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderColor: colors.surfaceContainer,
  },
  roleBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xs,
    color: colors.white,
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  username: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
  },
  email: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statVal: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.outline,
  },
  spinner: {
    marginVertical: spacing.xl,
  },

  // Recipes section
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  recipeThumb: {
    width: 80,
    height: 80,
    backgroundColor: colors.surfaceContainer,
  },
  recipePlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
  },
  recipeBody: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  typeCultural: {
    backgroundColor: '#4a1c00',
  },
  typeCommunity: {
    backgroundColor: colors.secondary,
  },
  typeBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.white,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },
  seeAll: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  seeAllText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },

  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.negative,
    marginTop: spacing.md,
  },
  signOutText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.negative,
  },
});
