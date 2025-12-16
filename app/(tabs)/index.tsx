import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';

export default function HomeScreen() {
  const user = useSelector((state: RootState) => state.user);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome, {user.name || 'User'}!</Text>
      <Text style={styles.subtitle}>Digital Healthcare Dashboard</Text>
      {/* Add your home screen content here */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
