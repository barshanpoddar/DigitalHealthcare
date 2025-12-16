import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { RootState, store } from '../src/store';
import { setUser } from '../src/store/userSlice';
import { SecureStorage } from '../src/utils/security';

function RootLayoutNav() {
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const userId = await SecureStorage.getUserId();
      const userData = await SecureStorage.getUserData();
      
      if (userId && userData) {
        dispatch(setUser({
          uid: userId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isLoggedIn: true,
          profileComplete: userData.profileComplete || true,
        }));
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return null; // Or show a loading screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="login" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <RootLayoutNav />
      </Provider>
    </SafeAreaProvider>
  );
}
