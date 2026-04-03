import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LibraryStackParamList } from './types';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

function MyLibraryScreen() {
  return <PlaceholderScreen name="My Library" />;
}

export function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyLibrary" component={MyLibraryScreen} />
    </Stack.Navigator>
  );
}
