import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';

import LoginLoadingScreen from '@/components/login-loading-screen';
import { initializeDatabase } from '@/database/database';
import { getCurrentUser } from '@/database/session';

const LOADING_DURATION_MS = 2000;

export default function Index() {
  const [destination, setDestination] = useState<
    '/(tabs)' | '/(unauthenticated)/login' | null
  >(null);

  const [restoringSession, setRestoringSession] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        await initializeDatabase();

        const user = await getCurrentUser();

        if (!active) return;

        if (user) {
          setRestoringSession(true);

          await new Promise(resolve =>
            setTimeout(resolve, LOADING_DURATION_MS)
          );

          if (!active) return;

          setDestination('/(tabs)');

          // FIX: Stop the loading screen after 2 seconds.
          setRestoringSession(false);
        } else {
          setDestination('/(unauthenticated)/login');
        }
      } catch (error) {
        console.error('Session Check Failed:', error);

        if (active) {
          setRestoringSession(false);
          setDestination('/(unauthenticated)/login');
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (restoringSession || !destination) {
    return <LoginLoadingScreen />;
  }

  return <Redirect href={destination} />;
}
