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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { FormTextInput } from '../components/shared/FormTextInput';
import { FormDropdown } from '../components/shared/FormDropdown';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const REGION_OPTIONS = [
  { label: 'Mediterranean', value: 'mediterranean' },
  { label: 'Middle East', value: 'middle_east' },
  { label: 'East Asia', value: 'east_asia' },
  { label: 'South Asia', value: 'south_asia' },
  { label: 'Southeast Asia', value: 'southeast_asia' },
  { label: 'Sub-Saharan Africa', value: 'sub_saharan_africa' },
  { label: 'North Africa', value: 'north_africa' },
  { label: 'Eastern Europe', value: 'eastern_europe' },
  { label: 'Western Europe', value: 'western_europe' },
  { label: 'Latin America', value: 'latin_america' },
  { label: 'North America', value: 'north_america' },
  { label: 'Oceania', value: 'oceania' },
];

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Arabic', value: 'ar' },
  { label: 'German', value: 'de' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
];

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'learner' | 'cook' | null>(null);
  const [region, setRegion] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Required';
    if (!lastName.trim()) next.lastName = 'Required';
    if (!email.trim() || !email.includes('@')) next.email = 'Valid email required';
    if (password.length < 8) next.password = 'At least 8 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!role) next.role = 'Please choose a role';
    if (!region) next.region = 'Required';
    if (!language) next.language = 'Required';
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
        email: email.trim(),
        password,
        role: role!,
        region,
        preferredLanguage: language,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed. Please try again.';
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
        <Text style={styles.headerTitle}>Roots & Recipes</Text>
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
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            error={errors.firstName}
          />
          <FormTextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            error={errors.lastName}
          />
          <FormTextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            error={errors.email}
          />
          <FormTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            error={errors.password}
          />
          <FormTextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            error={errors.confirmPassword}
          />

          {/* Role selection */}
          <Text style={styles.sectionLabel}>Choose Your Role</Text>
          {errors.role && <Text style={styles.fieldError}>{errors.role}</Text>}
          <View style={styles.roleRow}>
            <RoleCard
              title="Learner"
              description="Exploring family traditions and new flavors."
              icon="book-open-variant"
              selected={role === 'learner'}
              onPress={() => setRole('learner')}
            />
            <RoleCard
              title="Cook"
              description="Sharing and preserving daily kitchen rituals."
              icon="chef-hat"
              selected={role === 'cook'}
              onPress={() => setRole('cook')}
            />
          </View>

          <FormDropdown
            label="Region"
            value={region}
            options={REGION_OPTIONS}
            onSelect={setRegion}
            placeholder="Select region…"
            error={errors.region}
            searchable
          />
          <FormDropdown
            label="Language"
            value={language}
            options={LANGUAGE_OPTIONS}
            onSelect={setLanguage}
            placeholder="Select language…"
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
              <Text style={styles.submitButtonText}>Create Heirloom Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>Sign In</Text>
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
