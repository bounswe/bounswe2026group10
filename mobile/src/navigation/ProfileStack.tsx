import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { DevLoginScreen } from '../screens/DevLoginScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileScreen() {
  return <DevLoginScreen />;
}

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
