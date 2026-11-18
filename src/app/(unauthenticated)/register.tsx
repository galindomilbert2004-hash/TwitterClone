
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';

import { registerUser } from '@/database/auth';
import { syncUserToMockAPI } from '@/services/userSync';

const COLORS = {
  background: '#090909',
  surface: '#171717',
  orange: '#FF7417',
  orangeSoft: '#FF9A52',
  white: '#F5F5F5',
  muted: '#929292',
  border: '#71350F',
};

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      toValue,
      useNativeDriver: true,
      speed: 35,
      bounciness: 4,
    }).start();
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please complete all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Weak Password',
        'Password must contain at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      // Save account to local SQLite first.
      const userId = await registerUser(name, email, password);

      // Attempt to synchronize public profile with MockAPI.
      let cloudSyncMessage = '';

      try {
        await syncUserToMockAPI(userId);
        cloudSyncMessage =
          '\nYour public profile was synced to MockAPI.';
      } catch (syncError) {
        console.error('MockAPI registration sync error:', syncError);

        cloudSyncMessage =
          '\nCloud sync unavailable. Your account is saved locally.';
      }

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Registration Successful!',
        `Your account has been saved to SQLite.${cloudSyncMessage}\n\nUser ID: ${userId}`,
        [
          {
            text: 'Go to Login',
            onPress: () =>
              router.replace('/(unauthenticated)/login'),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong during registration.';

      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>
          <Text style={styles.logoAccent}>X_</Text>
          <Text style={styles.logoRest}>App</Text>
        </Text>
      </View>

      <Text style={styles.title}>CREATE ACCOUNT</Text>

      <Text style={styles.subtitle}>
        Join X_App and connect with your friends.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>FULL NAME</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor={COLORS.muted}
          value={name}
          onChangeText={setName}
          editable={!loading}
          selectionColor={COLORS.orange}
        />

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
            placeholder="Create a password"
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
            onPress={() => setShowPassword((visible) => !visible)}
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

        <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>

        <View style={styles.passwordField}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Re-enter your password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
            selectionColor={COLORS.orange}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() =>
              setShowConfirmPassword((visible) => !visible)
            }
            accessibilityRole="button"
            accessibilityLabel={
              showConfirmPassword
                ? 'Hide confirm password'
                : 'Show confirm password'
            }
            disabled={loading}
          >
            <Ionicons
              name={
                showConfirmPassword
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={22}
              color={COLORS.orangeSoft}
            />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{ transform: [{ scale: buttonScale }] }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={handleRegister}
            onPressIn={() => animateButton(0.97)}
            onPressOut={() => animateButton(1)}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.buttonText}>
                CREATE ACCOUNT
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
        </Text>

        <Link
          href="/(unauthenticated)/login"
          style={styles.link}
        >
          Login
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 35,
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
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
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.2,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 28,
  },

  formCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 20,
  },

  fieldLabel: {
    color: COLORS.orangeSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 9,
    marginTop: 17,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 11,
    backgroundColor: '#101010',
    color: COLORS.white,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  passwordField: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 11,
    backgroundColor: '#101010',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    color: COLORS.white,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  eyeButton: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  button: {
    height: 53,
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },

  disabledButton: {
    opacity: 0.65,
  },

  buttonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 27,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  link: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: '800',
  },
});

