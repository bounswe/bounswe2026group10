import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CreateStackParamList } from './types';
import { CreateBasicInfoScreen } from '../components/create-basic/CreateBasicInfoScreen';
import { CreateIngredientsToolsScreen } from '../components/create-ingredients/CreateIngredientsToolsScreen';
import { CreateStepsScreen } from '../components/create-steps/CreateStepsScreen';

const Stack = createNativeStackNavigator<CreateStackParamList>();

export function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateBasicInfo" component={CreateBasicInfoScreen} />
      <Stack.Screen name="CreateIngredientsTools" component={CreateIngredientsToolsScreen} />
      <Stack.Screen name="CreateSteps" component={CreateStepsScreen} />
    </Stack.Navigator>
  );
}
