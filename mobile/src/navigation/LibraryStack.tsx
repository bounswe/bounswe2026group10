import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { LibraryStackParamList } from "./types";
import { RecipeDetailScreen } from "../components/recipe-detail/RecipeDetailScreen";
import { MyLibraryScreen } from "../screens/MyLibraryScreen";

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyLibrary" component={MyLibraryScreen} />
      <Stack.Screen name="RecipeDetail">
        {({ route }) => <RecipeDetailScreen recipeId={route.params.recipeId} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
