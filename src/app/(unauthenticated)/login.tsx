
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';

import { loginUser } from '@/database/auth';
import { saveCurrentUser } from '@/database/session';
import { syncUserToMockAPI } from '@/services/userSync';
import LoginLoadingScreen from '@/components/login-loading-screen';

const COLORS = {
  background: '#090909',
  surface: '#171717',
  orange: '#FF7417',
  orangeSoft: '#FF9A52',
  white: '#F5F5F5',
  muted: '#929292',
  border: '#71350F',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginLoading, setShowLoginLoading] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      speed: 35,
      bounciness: 4,
    }).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const user = await loginUser(email, password);

      if (!user) {
        Alert.alert(
          'Login Failed',
          'Incorrect email or password. Please try again.'
        );
        return;
      }

      await saveCurrentUser(user.id);

      // Sync the account with MockAPI without blocking login.
      syncUserToMockAPI(user.id).catch((error) => {
        console.warn('MockAPI user sync pending:', error);
      });

      setShowLoginLoading(true);

      // Keep the login presentation at 2 seconds.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      router.replace('/(authenticated)/(tabs)/home');
    } catch (error) {
      console.error('Login error:', error);

      Alert.alert(
        'Login Error',
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (showLoginLoading) {
    return <LoginLoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>
          <Text style={styles.logoAccent}>X_</Text>
          <Text style={styles.logoRest}>App</Text>
        </Text>
      </View>

      <Text style={styles.title}>WELCOME BACK</Text>

      <Text style={styles.subtitle}>
        Sign in to continue to your account
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={COLORS.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          selectionColor={COLORS.orange}
        />

        <Text style={styles.fieldLabel}>PASSWORD</Text>

        <View style={styles.passwordField}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            selectionColor={COLORS.orange}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() =>
              setShowPassword((visible) => !visible)
            }
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Hide password' : 'Show password'
            }
            disabled={loading}
          >
            <Ionicons
              name={
                showPassword
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={22}
              color={COLORS.orangeSoft}
            />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            onPressIn={() => animateButton(0.97)}
            onPressOut={() => animateButton(1)}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
        </Text>

        <Link
          href="/(unauthenticated)/register"
          style={styles.link}
        >
          Create one
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 38,
    gap: 10,
  },
  logo: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: COLORS.orange,
  },
  logoRest: {
    color: COLORS.white,
  },
  title: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 28,
    fontSize: 14,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.orange,
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 4,
  },
  fieldLabel: {
    color: COLORS.orangeSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 9,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#101010',
    color: COLORS.white,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 18,
    fontSize: 15,
  },
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    color: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: COLORS.orange,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.orange,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  footerText: {
    color: COLORS.muted,
  },
  link: {
    color: COLORS.orangeSoft,
    fontWeight: '800',
  },
});

