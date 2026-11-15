import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import LogoutDoorAnimation from '@/components/logout-door-animation';

import {
  clearCurrentUser,
  getCurrentUser,
} from '@/database/session';
import {
  getProfile,
  updateProfile,
  UserProfile,
} from '@/database/profile';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const actionScale = useRef(new Animated.Value(1)).current;

  const animateAction = (toValue: number) => {
    Animated.spring(actionScale, { toValue, useNativeDriver: true, speed: 32, bounciness: 4 }).start();
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.replace('/(unauthenticated)/login');
        return;
      }

      const data = await getProfile(user.id);

      if (data) {
        setProfile(data);
        setName(data.name);
        setUsername(data.username ?? '');
        setBio(data.bio ?? '');
        setAvatarUri(data.avatar_uri);
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      Alert.alert('Error', 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  };

  const chooseProfilePicture = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo gallery.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);

      await updateProfile(
        profile.id,
        name,
        username,
        bio,
        avatarUri
      );

      await loadProfile();
      setEditing(false);

      Alert.alert('Success', 'Your profile has been updated!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Update failed',
        'Could not update your profile. Your username may already be taken.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setShowLogoutAnimation(true);
              await clearCurrentUser();

              await new Promise(resolve =>
                setTimeout(resolve, 2000)
              );

              router.replace('/(unauthenticated)/login');
            } catch (error) {
              setShowLogoutAnimation(false);
              Alert.alert('Error', 'Unable to log out.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7417" />
        <Text style={styles.muted}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Profile not found.</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.header}>Profile</Text>

      <View style={styles.profileCard}>
        <TouchableOpacity
          onPress={editing ? chooseProfilePicture : undefined}
          style={styles.avatarContainer}
          disabled={!editing}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {name.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}

          {editing && (
            <Text style={styles.changePhoto}>Change photo</Text>
          )}
        </TouchableOpacity>

        {!editing ? (
          <>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.username}>
              @{profile.username || 'username'}
            </Text>

            <Text style={styles.bio}>
              {profile.bio || 'No bio added yet.'}
            </Text>

            <Text style={styles.email}>{profile.email}</Text>

            <Animated.View style={{ transform: [{ scale: actionScale }] }}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setEditing(true)}
                onPressIn={() => animateAction(0.96)}
                onPressOut={() => animateAction(1)}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#888"
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              placeholderTextColor="#888"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself"
              placeholderTextColor="#888"
              multiline
              maxLength={160}
            />

            <Animated.View style={{ transform: [{ scale: actionScale }] }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              onPressIn={() => animateAction(0.96)}
              onPressOut={() => animateAction(1)}
              activeOpacity={0.9}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#090909" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setName(profile.name);
                setUsername(profile.username ?? '');
                setBio(profile.bio ?? '');
                setAvatarUri(profile.avatar_uri);
                setEditing(false);
              }}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* LOGOUT AT BOTTOM LEFT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutIcon}>↪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
      <Modal
        visible={showLogoutAnimation}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <LogoutDoorAnimation />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    backgroundColor: '#090909',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    color: '#F5F5F5',
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  profileCard: {
    backgroundColor: '#171717',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#101010',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF7417',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#090909',
    fontSize: 48,
    fontWeight: 'bold',
  },
  changePhoto: {
    color: '#FF7417',
    marginTop: 10,
    fontWeight: 'bold',
  },
  name: {
    color: '#F5F5F5',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 5,
  },
  username: {
    color: '#FF7417',
    fontSize: 15,
    marginTop: 5,
  },
  bio: {
    color: '#F5F5F5',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 18,
  },
  email: {
    color: '#929292',
    marginTop: 15,
  },
  muted: {
    color: '#929292',
    marginTop: 10,
  },
  form: {
    width: '100%',
    marginTop: 15,
  },
  label: {
    color: '#F5F5F5',
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#101010',
    color: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FF7417',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 25,
  },
  buttonText: {
    color: '#090909',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#F5F5F5',
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#101010',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 28,
  },
  logoutIcon: {
    color: '#FF6B6B',
    fontSize: 20,
    marginRight: 10,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
