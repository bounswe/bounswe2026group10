import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
import { useAuth } from '../context/AuthContext';
import { colors, fonts, fontSizes, spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { t } = useTranslation('common');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError(t('auth.login.errors.required'));
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('auth.login.errors.invalid');
      setError(msg);
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
          {/* Title */}
          <View style={styles.titleArea}>
            <Text style={styles.title}>
              {t('auth.login.title')}{' '}
              <Text style={styles.titleItalic}>{t('auth.login.titleEm')}</Text>
            </Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
          </View>

          {/* Error banner */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <FormTextInput
            label={t('auth.login.emailLabel')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.login.emailPlaceholder')}
          />

          {/* Password with show/hide */}
          <View style={styles.passwordContainer}>
            <FormTextInput
              label={t('auth.login.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.login.passwordPlaceholder')}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => setForgotModalVisible(true)}
          >
            <Text style={styles.forgotText}>{t('auth.login.forgotPassword')}</Text>
          </TouchableOpacity>

          {/* Remember me */}
          <View style={styles.rememberRow}>
            <Text style={styles.rememberLabel}>{t('auth.login.rememberMe')}</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.outline, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>{t('auth.login.signIn')}</Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t('auth.login.footerNoAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchLink}>{t('auth.login.register')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer links */}
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>{t('auth.login.privacy')}</Text>
            <Text style={styles.footerDot}> · </Text>
            <Text style={styles.footerLink}>{t('auth.login.terms')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot password modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setForgotModalVisible(false);
          setForgotSent(false);
          setForgotEmail('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setForgotModalVisible(false);
            setForgotSent(false);
            setForgotEmail('');
          }}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{t('auth.login.modalTitle')}</Text>
            {forgotSent ? (
              <Text style={styles.modalSuccess}>{t('auth.login.modalSuccess')}</Text>
            ) : (
              <>
                <FormTextInput
                  label={t('auth.login.emailLabel')}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  placeholder={t('auth.login.emailPlaceholder')}
                />
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => setForgotSent(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitButtonText}>{t('auth.login.modalSendReset')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
  },
  titleArea: {
    marginBottom: spacing['2xl'],
    marginTop: spacing.lg,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes['3xl'],
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  titleItalic: {
    fontFamily: fonts.serif,
    fontSize: fontSizes['3xl'],
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
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
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing['2xl'] + spacing.md + 2,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  rememberLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
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
    marginBottom: spacing.xl,
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
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerLink: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
  },
  footerDot: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
  },
  modalTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    marginBottom: spacing.xl,
  },
  modalSuccess: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.positive,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
});
