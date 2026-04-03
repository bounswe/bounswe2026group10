import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { continueAsGuest } = useAuth();

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Brand */}
        <View style={styles.brandArea}>
          <Text style={styles.appName}>Roots & Recipes</Text>
          <Text style={styles.headline}>
            {'Gathering the\n'}
            <Text style={styles.headlineItalic}>Flavors</Text>
            {' of\nGenerations.'}
          </Text>
          <Text style={styles.tagline}>Preserve. Cook. Share.</Text>
          <View style={styles.divider} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={continueAsGuest} activeOpacity={0.7}>
            <Text style={styles.guestLink}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#3b4a38',
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
  },
  brandArea: {
    marginTop: spacing['4xl'],
  },
  appName: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.lg,
    color: colors.tertiary,
    marginBottom: spacing.lg,
  },
  headline: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['4xl'],
    color: colors.white,
    lineHeight: 48,
    marginBottom: spacing.lg,
  },
  headlineItalic: {
    fontFamily: fonts.serif,
    fontSize: fontSizes['4xl'],
    color: colors.tertiary,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.white,
    opacity: 0.85,
    marginBottom: spacing.xl,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.tertiary,
    borderRadius: 1,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  primaryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  primaryButtonArrow: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xl,
    color: colors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 50,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  guestLink: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.7,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingVertical: spacing.sm,
  },
});
