import React from 'react';
import { Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { RecipeDetailScreen } from '../components/recipe-detail/RecipeDetailScreen';
import { CommentsRatingsScreen } from '../components/comments-ratings/CommentsRatingsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home feed coming soon</Text>
    </View>
  );
}

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RecipeDetail">
        {({ route }) => <RecipeDetailScreen recipeId={route.params.recipeId} />}
      </Stack.Screen>
      <Stack.Screen name="CommentsRatings">
        {({ route }) => <CommentsRatingsScreen {...route.params} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
