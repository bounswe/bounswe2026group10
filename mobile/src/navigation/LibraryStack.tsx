import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LibraryStackParamList } from "./types";
import { RecipeDetailScreen } from "../components/recipe-detail/RecipeDetailScreen";

const Stack = createNativeStackNavigator<LibraryStackParamList>();

const TEST_RECIPE_ID = "b416968f-6f69-4c4b-848e-1a479a799dc6";

function MyLibraryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("RecipeDetail", { recipeId: TEST_RECIPE_ID })
        }
        style={{ padding: 16, backgroundColor: "#86452a", borderRadius: 12 }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          View Test Recipe
        </Text>
      </TouchableOpacity>
    </View>
  );
}

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
