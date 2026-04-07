import './src/i18n';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import i18n from './src/i18n';
import {
  Newsreader_400Regular_Italic,
  Newsreader_700Bold_Italic,
} from '@expo-google-fonts/newsreader';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthStack } from './src/navigation/AuthStack';
import { TabNavigator } from './src/navigation/TabNavigator';
import { colors } from './src/theme';

function RootNavigator() {
  const { authState } = useAuth();

  if (authState.status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (authState.status === 'unauthenticated' && !authState.isGuest) {
    return <AuthStack />;
  }

  return <TabNavigator />;
}

export default function App() {
  // Restore persisted language on startup
  React.useEffect(() => {
    SecureStore.getItemAsync('app_language').then((lang) => {
      if (lang === 'en' || lang === 'tr') i18n.changeLanguage(lang);
    });
  }, []);

  const [fontsLoaded] = useFonts({
    Newsreader_400Regular_Italic,
    Newsreader_700Bold_Italic,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
