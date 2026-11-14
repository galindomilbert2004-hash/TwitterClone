import { FontAwesome } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
  createPost,
  deletePost,
  getPosts,
  updatePost,
  Post,
} from '@/database/posts';

import { getCurrentUser, CurrentUser } from '@/database/session';

export default function HomeScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        router.replace('/(unauthenticated)/login');
        return;
      }

      setCurrentUser(user);

      const savedPosts = await getPosts();
      setPosts(savedPosts);
    } catch (error) {
      console.error('Feed loading error:', error);
      Alert.alert('Error', 'Unable to load your Home Feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return posts;

    return posts.filter((post) => {
      const name = (post.name || '').toLowerCase();
      const username = (post.username || '').toLowerCase();
      const message = (post.content || '').toLowerCase();

      return (
        name.includes(keyword) ||
        username.includes(keyword) ||
        message.includes(keyword)
      );
    });
  }, [posts, search]);

  const handlePublish = async () => {
    if (!currentUser) return;

    if (!content.trim()) {
      Alert.alert('Empty post', 'Please write something first.');
      return;
    }

    try {
      setSaving(true);

      if (editingPostId !== null) {
        await updatePost(editingPostId, currentUser.id, content);
        Alert.alert('Success', 'Your post has been updated.');
      } else {
        await createPost(currentUser.id, content);
      }

      setContent('');
      setEditingPostId(null);
      await loadFeed();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPostId(post.id);
    setContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setContent('');
  };

  const handleDelete = (post: Post) => {
    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!currentUser) return;

            try {
              await deletePost(post.id, currentUser.id);
              await loadFeed();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Unable to delete post.'
              );
            }
          },
        },
      ]
    );
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'You have no notifications yet.');
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isOwner = currentUser?.id === item.user_id;

    return (
      <View style={styles.postCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>

        <View style={styles.postBody}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.name}</Text>
              <Text style={styles.username}>
                @{item.username || 'user'}
              </Text>
            </View>

            <Text style={styles.postDate}>
              {new Date(
                item.created_at.replace(' ', 'T') + 'Z'
              ).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.postContent}>{item.content}</Text>

          {isOwner && (
            <View style={styles.actions}>
              <Pressable
                style={styles.editButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D9BF0" />
        <Text style={styles.loadingText}>Loading X_App...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.logo}>X_App</Text>
            <FontAwesome name="twitter" size={25} color="#1D9BF0" />
          </View>

          <Pressable
            onPress={handleNotifications}
            style={styles.notificationButton}
            accessibilityLabel="Notifications"
          >
            <FontAwesome name="bell" size={21} color="#1D9BF0" />
          </Pressable>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
              placeholderTextColor="#8899A6"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* HOME FEED */}
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFeed();
              }}
              tintColor="#1D9BF0"
            />
          }
          ListHeaderComponent={
            <View style={styles.composer}>
              <Text style={styles.composerTitle}>
                {editingPostId !== null
                  ? 'Edit your post'
                  : "What's happening?"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Share your thoughts..."
                placeholderTextColor="#8899A6"
                multiline
                maxLength={280}
                value={content}
                onChangeText={setContent}
                editable={!saving}
              />

              <View style={styles.composerFooter}>
                <Text style={styles.characterCount}>
                  {content.length}/280
                </Text>

                <View style={styles.composerActions}>
                  {editingPostId !== null && (
                    <Pressable
                      style={styles.cancelButton}
                      onPress={handleCancelEdit}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[
                      styles.publishButton,
                      saving && styles.disabledButton,
                    ]}
                    onPress={handlePublish}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.publishText}>
                        {editingPostId !== null ? 'Save' : 'Post'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {search ? 'No matching posts' : 'No posts yet'}
              </Text>
              <Text style={styles.emptyText}>
                {search
                  ? 'Try another search.'
                  : 'Be the first to share something!'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.feedContent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    color: '#536471',
  },
  header: {
    height: 58,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: '#1D9BF0',
    fontSize: 23,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    color: '#1D9BF0',
    fontSize: 25,
  },
  searchRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  searchBox: {
    width: '78%',
    height: 42,
    backgroundColor: '#F0F3F5',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  searchIcon: {
    color: '#657786',
    fontSize: 25,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#14171A',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearch: {
    color: '#657786',
    fontSize: 16,
    paddingLeft: 8,
  },
  feedContent: {
    paddingBottom: 30,
  },
  composer: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  composerTitle: {
    color: '#14171A',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    minHeight: 100,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#14171A',
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  characterCount: {
    color: '#8899A6',
    fontSize: 13,
  },
  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  publishButton: {
    backgroundColor: '#1D9BF0',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 22,
    minWidth: 76,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  publishText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: '#536471',
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  postBody: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  authorName: {
    color: '#14171A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  username: {
    color: '#657786',
    fontSize: 13,
    marginLeft: 6,
  },
  postDate: {
    color: '#8899A6',
    fontSize: 11,
  },
  postContent: {
    color: '#14171A',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    marginTop: 14,
  },
  editButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  editText: {
    color: '#1D9BF0',
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  deleteText: {
    color: '#E0245E',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#14171A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#657786',
    marginTop: 8,
  },
});
