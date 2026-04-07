import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ProfileStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RecipeDetailScreen } from '../components/recipe-detail/RecipeDetailScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

function LoginPromptScreen() {
  const { exitGuest } = useAuth();
  const { t } = useTranslation('common');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <MaterialCommunityIcons name="account-circle-outline" size={80} color={colors.outline} />
        <Text style={styles.title}>{t('profileScreen.loginPrompt.title')}</Text>
        <Text style={styles.subtitle}>{t('profileScreen.loginPrompt.subtitle')}</Text>
        <TouchableOpacity style={styles.signInButton} onPress={exitGuest} activeOpacity={0.85}>
          <Text style={styles.signInButtonText}>{t('profileScreen.loginPrompt.signIn')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ProfileRoot() {
  const { authState } = useAuth();
  if (authState.status !== 'authenticated') {
    return <LoginPromptScreen />;
  }
  return <ProfileScreen />;
}

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileRoot} />
      <Stack.Screen name="RecipeDetail">
        {({ route }) => <RecipeDetailScreen recipeId={route.params.recipeId} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes['2xl'],
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['4xl'],
    marginTop: spacing.md,
  },
  signInButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
});
