import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CreateStackParamList } from './types';
import { CreateBasicInfoScreen } from '../components/create-basic/CreateBasicInfoScreen';

const Stack = createNativeStackNavigator<CreateStackParamList>();

export function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateBasicInfo" component={CreateBasicInfoScreen} />
    </Stack.Navigator>
  );
}
