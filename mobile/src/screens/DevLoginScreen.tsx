import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing } from '../theme';
import { login, logout, getMe } from '../api/auth';
import { getToken } from '../api/client';
import type { MeResponse } from '../api/auth';

export function DevLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      const user = await getMe();
      setMe(user);
    } catch (err: any) {
      Alert.alert('Login failed', err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setMe(null);
    } catch (err: any) {
      Alert.alert('Logout failed', err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  const token = getToken();

  if (me) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Logged in</Text>
          <Text style={styles.info}>@{me.username}</Text>
          <Text style={styles.info}>{me.email}</Text>
          <Text style={styles.info}>Role: {me.role}</Text>
          <Text style={styles.tokenLabel}>Bearer token (first 40 chars):</Text>
          <Text style={styles.token}>{token?.slice(0, 40)}…</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.logoutText}>Log out</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Dev Login</Text>
        <Text style={styles.subtitle}>Log in to enable authenticated API calls (video upload etc.)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.outline}
          secureTextEntry
        />
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.loginText}>Log in</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['3xl'],
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    marginBottom: spacing['2xl'],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  info: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  tokenLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  token: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  logoutBtn: {
    backgroundColor: colors.negative,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
});
