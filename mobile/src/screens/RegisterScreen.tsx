import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { FormTextInput } from '../components/shared/FormTextInput';
import { FormDropdown } from '../components/shared/FormDropdown';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { t } = useTranslation('common');

  const LANGUAGE_OPTIONS = [
    { label: t('auth.register.languageTurkish'), value: 'tr' },
    { label: t('auth.register.languageEnglish'), value: 'en' },
  ];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'learner' | 'cook' | 'expert' | null>(null);
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = t('auth.register.errors.required');
    if (!lastName.trim()) next.lastName = t('auth.register.errors.required');
    if (!username.trim()) next.username = t('auth.register.errors.required');
    if (!email.trim() || !email.includes('@')) next.email = t('auth.register.errors.emailInvalid');
    if (password.length < 8) next.password = t('auth.register.errors.passwordMin');
    if (password !== confirmPassword) next.confirmPassword = t('auth.register.errors.confirmMismatch');
    if (!role) next.role = t('auth.register.errors.roleRequired');
    if (!country.trim()) next.country = t('auth.register.errors.required');
    if (!language) next.language = t('auth.register.errors.required');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role: role!,
        region: country.trim(),
        preferredLanguage: language,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('auth.register.errors.registerFailed');
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('app.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {errors.submit && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.submit}</Text>
            </View>
          )}

          <FormTextInput
            label={t('auth.register.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('auth.register.firstNamePlaceholder')}
            error={errors.firstName}
          />
          <FormTextInput
            label={t('auth.register.lastName')}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('auth.register.lastNamePlaceholder')}
            error={errors.lastName}
          />
          <FormTextInput
            label={t('auth.register.username')}
            value={username}
            onChangeText={setUsername}
            placeholder={t('auth.register.usernamePlaceholder')}
            error={errors.username}
          />
          <FormTextInput
            label={t('auth.register.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.register.emailPlaceholder')}
            error={errors.email}
          />
          <FormTextInput
            label={t('auth.register.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.register.passwordPlaceholder')}
            error={errors.password}
          />
          <FormTextInput
            label={t('auth.register.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            error={errors.confirmPassword}
          />

          {/* Role selection */}
          <Text style={styles.sectionLabel}>{t('auth.register.rolesLegend')}</Text>
          {errors.role && <Text style={styles.fieldError}>{errors.role}</Text>}
          <View style={styles.roleRow}>
            <RoleCard
              title={t('auth.register.roleLearner')}
              description={t('auth.register.roleLearnerDesc')}
              icon="book-open-variant"
              selected={role === 'learner'}
              onPress={() => setRole('learner')}
            />
            <RoleCard
              title={t('auth.register.roleCook')}
              description={t('auth.register.roleCookDesc')}
              icon="chef-hat"
              selected={role === 'cook'}
              onPress={() => setRole('cook')}
            />
            <RoleCard
              title={t('auth.register.roleExpert')}
              description={t('auth.register.roleExpertDesc')}
              icon="medal-outline"
              selected={role === 'expert'}
              onPress={() => setRole('expert')}
            />
          </View>

          <FormTextInput
            label={t('auth.register.country')}
            value={country}
            onChangeText={setCountry}
            placeholder={t('auth.register.countryPlaceholder')}
            error={errors.country}
          />
          <FormDropdown
            label={t('auth.register.profileLanguage')}
            value={language}
            options={LANGUAGE_OPTIONS}
            onSelect={setLanguage}
            placeholder={t('auth.register.languagePlaceholder')}
            error={errors.language}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>{t('auth.register.submit')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t('auth.register.footerHasAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>{t('auth.register.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.roleCard, selected && styles.roleCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={icon as never}
        size={24}
        color={selected ? colors.primary : colors.onSurfaceVariant}
        style={styles.roleIcon}
      />
      <View style={styles.roleText}>
        <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>{title}</Text>
        <Text style={styles.roleDesc}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
    paddingTop: spacing.lg,
  },
  errorBanner: {
    backgroundColor: '#fde8e8',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
  },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  fieldError: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.negative,
    marginBottom: spacing.sm,
  },
  roleRow: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#fff4ef',
  },
  roleIcon: {
    marginRight: spacing.md,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    marginBottom: 2,
  },
  roleTitleSelected: {
    color: colors.primary,
  },
  roleDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  switchLink: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
});
