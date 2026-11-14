import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

import { initializeDatabase } from '@/database/database';
import { getCurrentUser } from '@/database/session';

export default function Index() {
  const [destination, setDestination] = useState<
    '/(tabs)' | '/(unauthenticated)/login' | null
  >(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        await initializeDatabase();
        const user = await getCurrentUser();

        if (active) {
          setDestination(
            user ? '/(tabs)' : '/(unauthenticated)/login'
          );
        }
      } catch (error) {
        console.error('Session check failed:', error);

        if (active) {
          setDestination('/(unauthenticated)/login');
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (!destination) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101827',
  },
});
