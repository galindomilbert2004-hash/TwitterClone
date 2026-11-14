import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

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
              await clearCurrentUser();
              router.replace('/(unauthenticated)/login');
            } catch (error) {
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
        <ActivityIndicator size="large" color="#38BDF8" />
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

            <TouchableOpacity
              style={styles.button}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
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

            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#101827" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101827',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    backgroundColor: '#101827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  profileCard: {
    backgroundColor: '#1E293B',
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
    backgroundColor: '#334155',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#101827',
    fontSize: 48,
    fontWeight: 'bold',
  },
  changePhoto: {
    color: '#38BDF8',
    marginTop: 10,
    fontWeight: 'bold',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 5,
  },
  username: {
    color: '#38BDF8',
    fontSize: 15,
    marginTop: 5,
  },
  bio: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 18,
  },
  email: {
    color: '#94A3B8',
    marginTop: 15,
  },
  muted: {
    color: '#94A3B8',
    marginTop: 10,
  },
  form: {
    width: '100%',
    marginTop: 15,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#334155',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#38BDF8',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 25,
  },
  buttonText: {
    color: '#101827',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 28,
  },
  logoutIcon: {
    color: '#F87171',
    fontSize: 20,
    marginRight: 10,
  },
  logoutText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
