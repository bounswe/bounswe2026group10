import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
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
import { RecipeDetailScreen } from './src/components/recipe-detail/RecipeDetailScreen';
import { mockRecipe } from './src/data/mockRecipe';
import { mockAlternatives } from './src/data/mockAlternatives';
import { colors } from './src/theme';

export default function App() {
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
      <RecipeDetailScreen recipe={mockRecipe} alternatives={mockAlternatives} />
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
