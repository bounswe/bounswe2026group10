import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import { RecipeDetailScreen } from '../components/recipe-detail/RecipeDetailScreen';
import { mockRecipe } from '../data/mockRecipe';
import { mockAlternatives } from '../data/mockAlternatives';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeScreen() {
  return <RecipeDetailScreen recipe={mockRecipe} alternatives={mockAlternatives} />;
}

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RecipeDetail">
        {({ route }) => (
          <RecipeDetailScreen
            recipe={route.params.recipe}
            alternatives={route.params.alternatives}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
