import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { RecipeDetailScreen } from '../components/recipe-detail/RecipeDetailScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

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
