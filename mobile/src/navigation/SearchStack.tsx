import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SearchStackParamList } from './types';
import { SearchScreen } from '../screens/SearchScreen';
import { DishVarietyDetailScreen } from '../screens/DishVarietyDetailScreen';
import { RecipeDetailScreen } from '../components/recipe-detail/RecipeDetailScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="DishVarietyDetail" component={DishVarietyDetailScreen} />
      <Stack.Screen name="RecipeDetail">
        {({ route }) => <RecipeDetailScreen recipeId={route.params.recipeId} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
