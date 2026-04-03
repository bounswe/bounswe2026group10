import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CreateStackParamList, RootTabParamList } from './types';
import { RecipeFormProvider } from '../context/RecipeFormContext';
import { useAuth } from '../context/AuthContext';
import { CreateBasicInfoScreen } from '../components/create-basic/CreateBasicInfoScreen';
import { CreateIngredientsToolsScreen } from '../components/create-ingredients/CreateIngredientsToolsScreen';
import { CreateStepsScreen } from '../components/create-steps/CreateStepsScreen';
import { CreateReviewScreen } from '../components/create-review/CreateReviewScreen';

const Stack = createNativeStackNavigator<CreateStackParamList>();

export function CreateStack() {
  const { authState } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  const role = authState.status === 'authenticated' ? (authState.user.role ?? '').toUpperCase() : '';
  const canCreate = role === 'COOK' || role === 'EXPERT';

  useEffect(() => {
    if (!canCreate) {
      Alert.alert('Permission Required', 'You should be a Cook or Expert to create a Recipe.');
      navigation.navigate('HomeTab');
    }
  }, [canCreate]);

  if (!canCreate) return null;

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
