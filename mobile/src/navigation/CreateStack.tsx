import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CreateStackParamList } from './types';
import { RecipeFormProvider } from '../context/RecipeFormContext';
import { CreateBasicInfoScreen } from '../components/create-basic/CreateBasicInfoScreen';
import { CreateIngredientsToolsScreen } from '../components/create-ingredients/CreateIngredientsToolsScreen';
import { CreateStepsScreen } from '../components/create-steps/CreateStepsScreen';
import { CreateReviewScreen } from '../components/create-review/CreateReviewScreen';

const Stack = createNativeStackNavigator<CreateStackParamList>();

export function CreateStack() {
  return (
    <RecipeFormProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CreateBasicInfo" component={CreateBasicInfoScreen} />
        <Stack.Screen name="CreateIngredientsTools" component={CreateIngredientsToolsScreen} />
        <Stack.Screen name="CreateSteps" component={CreateStepsScreen} />
        <Stack.Screen name="CreateReview" component={CreateReviewScreen} />
      </Stack.Navigator>
    </RecipeFormProvider>
  );
}
