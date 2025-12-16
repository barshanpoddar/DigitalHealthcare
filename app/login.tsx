import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { auth, db } from '../src/services/firebase';
import { setUser } from '../src/store/userSlice';
import { BiometricAuth, HIPAACompliance, SecureStorage } from '../src/utils/security';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await BiometricAuth.isBiometricAvailable();
    setBiometricAvailable(available);
  };

  const loadBiometricPreference = async () => {
    const enabled = await SecureStorage.getBiometricPreference();
    setBiometricEnabled(enabled);
  };

  const handleBiometricToggle = async (value: boolean) => {
    setBiometricEnabled(value);
    await SecureStorage.saveBiometricPreference(value);
  };

  const handleBiometricLogin = async () => {
    const success = await BiometricAuth.authenticateWithBiometrics();
    if (success) {
      Alert.alert('Success', 'Biometric authentication successful!');
      // In a real app, you would retrieve stored credentials here
    } else {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Store sensitive data securely
        await SecureStorage.saveAuthToken(await userCredential.user.getIdToken());
        await SecureStorage.saveUserId(userCredential.user.uid);
        await SecureStorage.saveUserData(userData);

        // Log access for HIPAA compliance
        HIPAACompliance.logDataAccess(
          userCredential.user.uid,
          'LOGIN',
          'user_authentication'
        );

        dispatch(setUser({
          uid: userCredential.user.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isLoggedIn: true,
          profileComplete: true,
        }));
          // Navigation: replace login with the app root so layout shows tabs
          router.replace('/');
      } else {
        Alert.alert('Error', 'User profile not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
        <Text style={styles.title}>Digital Healthcare</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {biometricAvailable && (
          <View style={styles.biometricSection}>
            <View style={styles.biometricRow}>
              <Text style={styles.biometricText}>Enable Biometric Login</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={biometricEnabled ? '#007AFF' : '#f4f3f4'}
              />
            </View>

            {biometricEnabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <Text style={styles.biometricButtonText}>🔐 Login with Biometrics</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text
              style={styles.linkText}
              onPress={() => router.push('/signup')}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  biometricSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  biometricText: {
    fontSize: 16,
    color: '#333',
  },
  biometricButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
