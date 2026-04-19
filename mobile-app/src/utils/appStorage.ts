import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAppStorage() {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.warn('Failed to clear app storage:', error);
  }
}
