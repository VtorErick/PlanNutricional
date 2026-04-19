import 'react-native-reanimated';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import AppErrorBoundary from '@/src/components/AppErrorBoundary';
import { DietProvider, useDiet } from '@/src/context/DietContext';

LogBox.ignoreLogs([
  'Require cycle: src/utils/nutrition.ts -> src/utils/nutritionValidation.ts -> src/data/mealsDB.ts -> src/utils/nutrition.ts',
  'Require cycle: src/utils/nutritionValidation.ts -> src/data/mealsDB.ts -> src/utils/nutritionValidation.ts',
]);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
        <BottomSheetModalProvider>
          <DietProvider>
            <AppNavigator />
          </DietProvider>
        </BottomSheetModalProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { isDarkMode } = useDiet();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ title: 'Admin' }} />
        <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
